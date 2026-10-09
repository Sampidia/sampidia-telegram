'use client';

export default function GoogleReviews() {
  return (
    <div>
      {/* Override Elfsight widget heading colours */}
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

      <p
        style={{
          textAlign: 'center',
          color: '#ffffff',
          fontSize: '20px',
          fontWeight: 700,
          marginBottom: '12px',
          marginTop: '8px',
        }}
      >
        What Our Customers Say
      </p>

      <div className="elfsight-app-96b17c36-2345-4cb3-aa86-714875053c65" data-elfsight-app-lazy></div>
    </div>
  );
}
