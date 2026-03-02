import os
import fitz  # PyMuPDF
import pytesseract
from pytesseract import TesseractNotFoundError
from PIL import Image
import io
import numpy as np
import tempfile
from transformers import pipeline
import torch


# Global summarizer helper
_summarizer = None
_model_loading = False
_easyocr_reader = None


def get_easyocr_reader():
    """Lazy-load EasyOCR reader to avoid repeated heavy initialisation."""
    global _easyocr_reader
    if _easyocr_reader is None:
        import easyocr
        print("Loading EasyOCR reader for OCR fallback...")
        _easyocr_reader = easyocr.Reader(['en'], gpu=torch.cuda.is_available())
        print("EasyOCR reader ready.")
    return _easyocr_reader


def extract_text_from_pdf(pdf_path):
    """Extract selectable text and/or OCR text from PDF."""
    selectable_text = ""
    ocr_text = ""

    pdf_document = fitz.open(pdf_path)

    try:
        for page_num in range(len(pdf_document)):
            page = pdf_document.load_page(page_num)
            page_text = page.get_text()
            page_text = "\n".join([line.strip() for line in page_text.splitlines() if line.strip()])
            selectable_text += page_text + "\n"

        if selectable_text.strip():
            print("Selectable text found in PDF, skipping OCR.")
        else:
            print("No selectable text found. Running OCR fallback...")
            ocr_text = run_ocr_on_pdf(pdf_document)

    finally:
        if not pdf_document.is_closed:
            pdf_document.close()

    combined_text = (selectable_text + "\n" + ocr_text).strip()
    return combined_text


def run_ocr_on_pdf(pdf_document):
    """Render each PDF page and run OCR using pytesseract/easyocr."""
    ocr_text = ""
    easyocr_reader = None

    for page_num in range(len(pdf_document)):
        page = pdf_document.load_page(page_num)
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # upscale for better OCR
        image_bytes = pix.tobytes("png")
        image = Image.open(io.BytesIO(image_bytes))

        page_text = ""
        try:
            page_text = pytesseract.image_to_string(image)
        except TesseractNotFoundError:
            print("Tesseract not installed. Falling back to EasyOCR.")
        except Exception as e:
            print(f"pytesseract OCR error on page {page_num + 1}: {e}")

        if not page_text or not page_text.strip():
            try:
                if easyocr_reader is None:
                    easyocr_reader = get_easyocr_reader()
                ocr_result = easyocr_reader.readtext(np.array(image), detail=0, paragraph=True)
                page_text = " ".join(ocr_result)
            except Exception as e:
                print(f"EasyOCR error on page {page_num + 1}: {e}")
                page_text = ""

        page_text = "\n".join([line.strip() for line in page_text.splitlines() if line.strip()])

        if page_text:
            ocr_text += f"\n\n[Page {page_num + 1} OCR]\n{page_text}"

    if not ocr_text.strip():
        print("OCR fallback did not extract any text.")
    else:
        print("OCR fallback extracted text successfully.")

    return ocr_text.strip()


def split_keep_context(text, chunk_size=16384):
    lines = text.split('\n')
    chunk_texts = []
    current_chunk = ""
    for line in lines:
        if len(current_chunk) + len(line) < chunk_size:
            current_chunk += line + '\n'
        else:
            chunk_texts.append(current_chunk)
            current_chunk = line + '\n'
    if current_chunk:
        chunk_texts.append(current_chunk)
    return chunk_texts


def summarize(large_text):
    global _summarizer, _model_loading
    if _summarizer is None and not _model_loading:
        _model_loading = True
        try:
            hf_name = 'pszemraj/led-large-book-summary'
            print("Loading summarization model... This may take a few minutes on first use.")
            _summarizer = pipeline(
                "summarization",
                hf_name,
                device=0 if torch.cuda.is_available() else -1,
            )
            print("Summarization model loaded successfully!")
        except Exception as e:
            print(f"Error loading summarization model: {e}")
            _model_loading = False
            raise RuntimeError(f"Failed to load summarization model: {str(e)}")
        finally:
            _model_loading = False
    elif _model_loading:
        # Wait for model to finish loading
        import time
        max_wait = 300  # 5 minutes max wait
        waited = 0
        while _model_loading and waited < max_wait:
            time.sleep(1)
            waited += 1
        if _summarizer is None:
            raise RuntimeError("Model loading timed out or failed")

    wall_of_text = large_text

    result = _summarizer(
        wall_of_text,
        min_length=16,
        max_length=256,
        no_repeat_ngram_size=3,
        encoder_no_repeat_ngram_size=3,
        repetition_penalty=3.5,
        num_beams=4,
        early_stopping=True,
    )

    return result


def process_pdf_file(pdf_path):
    """Main function to process PDF file and generate summary"""
    try:
        # Extract text from the PDF file
        print(f"Extracting text from PDF: {pdf_path}")
        extracted_text = extract_text_from_pdf(pdf_path)
        
        if not extracted_text or extracted_text.strip() == "":
            return {'error': 'No text could be extracted from the PDF. The PDF might be empty or contain only images without OCR support.'}
        
        print(f"Extracted text length: {len(extracted_text)} characters")
        
        # Split text into chunks for summarization (same as video endpoint)
        chunk_texts = split_keep_context(extracted_text)
        print(f"Split into {len(chunk_texts)} chunks for summarization")
        
        # Check if model is ready
        print("Checking if summarization model is ready...")
        try:
            # Test with a small sample to ensure model is loaded
            test_text = extracted_text[:100] if len(extracted_text) > 100 else extracted_text
            if test_text.strip():
                _ = summarize(test_text)
                print("Model is ready!")
        except Exception as e:
            print(f"Model not ready or error: {e}")
            return {'error': f'Summarization model is not ready: {str(e)}. Please wait a moment and try again, or check the server console for details.'}
        
        summaries = []
        for i, chunk_text in enumerate(chunk_texts):
            print(f"Summarizing chunk {i+1}/{len(chunk_texts)}...")
            try:
                summary = summarize(chunk_text)
                if summary and len(summary) > 0:
                    summaries.append(summary)
                else:
                    print(f"Warning: Chunk {i+1} returned empty summary")
            except Exception as e:
                print(f"Error summarizing chunk {i+1}: {e}")
                import traceback
                print(traceback.format_exc())
                # Continue with other chunks even if one fails
                continue
        
        if not summaries:
            return {'error': 'Failed to generate summary from any chunks. The text might be too short or the model failed to process it.'}
        
        combined_summary = ""
        for i, summary in enumerate(summaries):
            if summary and len(summary) > 0 and 'summary_text' in summary[0]:
                combined_summary += summary[0]['summary_text'] + " "
        
        if not combined_summary.strip():
            return {'error': 'Summary was generated but is empty.'}
        
        print(f"Generated summary length: {len(combined_summary)} characters")
        
        return {
            'summary': combined_summary.strip(),
            'extracted_text': extracted_text
        }
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error processing PDF: {e}")
        print(f"Traceback: {error_trace}")
        return {'error': f'Error processing PDF: {str(e)}'}