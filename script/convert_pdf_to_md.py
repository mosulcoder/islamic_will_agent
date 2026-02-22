import sys
import pymupdf4llm

def main():
    if len(sys.argv) < 3:
        print("Usage: python convert_pdf_to_md.py <input.pdf> <output.md>")
        sys.exit(1)
        
    pdf_path = sys.argv[1]
    md_path = sys.argv[2]
    
    print(f"Converting {pdf_path} to Markdown...")
    try:
        md_text = pymupdf4llm.to_markdown(pdf_path)
        with open(md_path, 'w', encoding='utf-8') as f:
            f.write(md_text)
        print(f"Successfully wrote {md_path}")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
