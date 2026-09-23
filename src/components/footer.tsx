export function Footer() {
  return (
    <footer className="mt-auto border-t border-stone-200/60 py-8 text-center text-xs text-stone-500">
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2">
          <span className="font-medium text-stone-700">PicForge AI</span>
          <span>&middot;</span>
          <span>Classroom Demonstration</span>
        </div>
        <div className="flex items-center gap-1.5 text-stone-500">
          <span>Built with</span>
          <span className="font-semibold text-stone-800">Pollinations AI</span>
          <span>&middot;</span>
          <span>FLUX</span>
        </div>
      </div>
    </footer>
  );
}

