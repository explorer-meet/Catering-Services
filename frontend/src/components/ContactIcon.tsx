type ContactIconName = "phone" | "mail" | "location";

export function ContactIcon({ name }: { name: ContactIconName }) {
  if (name === "phone") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 2.5 9.2 2l2.1 5.1-2.2 1.8a16 16 0 0 0 6 6l1.8-2.2L22 14.8l-.5 2.6c-.3 1.4-1.6 2.4-3 2.2C9.8 18.5 5.5 14.2 4.4 5.5c-.2-1.4.8-2.7 2.2-3Z" /></svg>;
  }

  if (name === "mail") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm0 3.2v.2l9 5.6 9-5.6v-.2H3Zm18 8.8V10.8l-8.5 5.3a1 1 0 0 1-1 0L3 10.8V17h18Z" /></svg>;
  }

  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1a8 8 0 0 0-8 8c0 5.8 8 14 8 14s8-8.2 8-14a8 8 0 0 0-8-8Zm0 11.2A3.2 3.2 0 1 1 12 5a3.2 3.2 0 0 1 0 6.2Z" /></svg>;
}
