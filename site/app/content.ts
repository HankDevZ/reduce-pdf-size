export const faqItems = [
  {
    question: "How do I make a PDF file smaller so I can upload it?",
    answer:
      "Use Balanced compression first, then compare the output with the upload limit shown by the destination website. If the file is still too large, run the original PDF again with Smallest Size. Results vary because image-heavy and scanned PDFs behave differently from files that mainly contain text.",
  },
  {
    question: "What should I do if my PDF is still too large?",
    answer:
      "Try Smallest Size and inspect the downloaded copy carefully. If that is still too large, the document may already be optimized or may contain content that cannot be reduced much without a larger quality change. This tool will not present a larger output as a successful compression.",
  },
  {
    question: "Can I reduce PDF size without losing quality?",
    answer:
      "You can often make a PDF smaller while keeping it clear enough for its intended use, but compression is not guaranteed to be lossless. High Quality makes the smallest visual compromise, Balanced suits everyday sharing, and Smallest Size trades more image detail for a lower file size.",
  },
  {
    question: "Can I compress a PDF to 1MB or 300KB?",
    answer:
      "You can try to reach 1MB or 300KB, but this version does not support an exact target size and cannot guarantee either result. Choose a compression level, check the output size, and use a stronger level if necessary. The achievable size depends on the PDF’s pages, images, fonts, and existing optimization.",
  },
  {
    question: "Does this tool work with scanned PDFs?",
    answer:
      "Yes, many scanned PDFs can be reduced because their pages are stored as large images. Balanced is a sensible first choice. Review small text, stamps, signatures, and fine lines in the downloaded PDF, since stronger image compression may make those details less sharp.",
  },
  {
    question: "Are my PDF files uploaded to a server?",
    answer:
      "No. The selected PDF is passed from the page to a dedicated browser worker and processed locally on your device. The app does not send the PDF bytes through a form, analytics service, or compression API. Resetting the tool or closing the page removes the in-memory result and its temporary download URL.",
    href: "/privacy",
    linkLabel: "Read the privacy details.",
  },
] as const;

export function faqAnswerText(item: (typeof faqItems)[number]) {
  return "linkLabel" in item ? `${item.answer} ${item.linkLabel}` : item.answer;
}
