def split_keep_context(text, chunk_size=16384):
    """
    Split text into chunks but keep same lines in 2 parts at the end and start
    """
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


def merge_chunks(chunks):
    """
    Merge text chunks back together
    """
    return ''.join(chunks)