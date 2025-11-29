export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy via-navy-light to-green-dark">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4 animate-pulse">
          <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
            <path d="M12 2C12 2 8 6 8 12C8 18 12 22 12 22" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 2C12 2 16 6 16 12C16 18 12 22 12 22" stroke="currentColor" strokeWidth="2"/>
            <path d="M2 12C2 12 6 8 12 8C18 8 22 12 22 12" stroke="currentColor" strokeWidth="2"/>
            <path d="M2 12C2 12 6 16 12 16C18 16 22 12 22 12" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </div>
        <p className="text-white text-lg font-medium">Carregando...</p>
      </div>
    </div>
  );
}
