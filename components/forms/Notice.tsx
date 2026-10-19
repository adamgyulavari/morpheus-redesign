/** A form's answer: an error (alert) or a confirmation (status); nothing without either. */
export default function Notice({ error, message }: { error?: string; message?: string }) {
  if (error)
    return (
      <p role="alert" className="rounded-xl bg-rust/10 px-4 py-3 text-[15px] font-semibold text-rust-dark">
        {error}
      </p>
    );
  if (message)
    return (
      <p role="status" className="rounded-xl bg-teal/10 px-4 py-3 text-[15px] font-semibold text-teal">
        {message}
      </p>
    );
  return null;
}
