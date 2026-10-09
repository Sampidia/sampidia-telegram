'use client';

export default function GoogleReviews() {
  return (
    <div>
      {/* Override Elfsight widget heading colour to white */}
      <style>{`
        .elfsight-app-96b17c36-2345-4cb3-aa86-714875053c65 h1,
        .elfsight-app-96b17c36-2345-4cb3-aa86-714875053c65 h2,
        .elfsight-app-96b17c36-2345-4cb3-aa86-714875053c65 h3,
        .elfsight-app-96b17c36-2345-4cb3-aa86-714875053c65 h4,
        .elfsight-app-96b17c36-2345-4cb3-aa86-714875053c65 [class*="title"],
        .elfsight-app-96b17c36-2345-4cb3-aa86-714875053c65 [class*="heading"] {
          color: #ffffff !important;
        }
      `}</style>

      <div className="elfsight-app-96b17c36-2345-4cb3-aa86-714875053c65" data-elfsight-app-lazy></div>
    </div>
  );
}
