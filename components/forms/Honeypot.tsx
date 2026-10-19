/** Hidden from people (and screen readers), filled in by bots: the server ignores a form that has it. */
export default function Honeypot() {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label>
        Weboldal
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}
