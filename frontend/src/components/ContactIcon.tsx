type ContactIconName = "phone" | "mail" | "location" | "whatsapp" | "clock";

export function ContactIcon({ name }: { name: ContactIconName }) {
  if (name === "phone") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 2.5 9.2 2l2.1 5.1-2.2 1.8a16 16 0 0 0 6 6l1.8-2.2L22 14.8l-.5 2.6c-.3 1.4-1.6 2.4-3 2.2C9.8 18.5 5.5 14.2 4.4 5.5c-.2-1.4.8-2.7 2.2-3Z" /></svg>;
  }

  if (name === "mail") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm0 3.2v.2l9 5.6 9-5.6v-.2H3Zm18 8.8V10.8l-8.5 5.3a1 1 0 0 1-1 0L3 10.8V17h18Z" /></svg>;
  }

  if (name === "whatsapp") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 3.5A11.8 11.8 0 0 0 12.1 0C5.6 0 .3 5.3.3 11.8c0 2.1.5 4.1 1.6 5.9L.2 24l6.5-1.7a11.8 11.8 0 0 0 5.4 1.3h.1c6.5 0 11.8-5.3 11.8-11.8 0-3.2-1.3-6.1-3.5-8.3Zm-8.4 18.1h-.1a9.8 9.8 0 0 1-5-1.4l-.4-.2-3.9 1 1-3.8-.3-.4a9.8 9.8 0 1 1 8.7 4.8Zm5.4-7.4c-.3-.2-1.7-.8-2-.9-.3-.1-.5-.2-.7.2l-.8 1c-.2.2-.4.3-.7.1-2.4-1.2-4-2.1-5.6-4.8-.4-.7.4-.6 1.1-2 0-.3 0-.5-.1-.7l-.7-1.8c-.2-.5-.4-.4-.7-.4h-.6c-.2 0-.6.1-.9.4-.3.3-1.1 1.1-1.1 2.7s1.1 3.1 1.2 3.3c.2.2 2.2 3.4 5.4 4.8 2 .9 2.8 1 3.8.8.6-.1 1.7-.7 1.9-1.4.3-.7.3-1.3.2-1.4Z" /></svg>;
  }

  if (name === "clock") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.2" /><path d="M12 7v5l3.5 2" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  }

  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1a8 8 0 0 0-8 8c0 5.8 8 14 8 14s8-8.2 8-14a8 8 0 0 0-8-8Zm0 11.2A3.2 3.2 0 1 1 12 5a3.2 3.2 0 0 1 0 6.2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /></svg>;
}
