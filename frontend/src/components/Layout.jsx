import React from 'react';

const steps = [
  { id: 1, label: 'Movie' },
  { id: 2, label: 'Timing' },
  { id: 3, label: 'Screen' },
  { id: 4, label: 'Seat' },
  { id: 5, label: 'Food' },
  { id: 6, label: 'Payment' },
  { id: 7, label: 'Confirm' }
];

const Layout = ({ children, currentStep, title, subtitle }) => {
  return (
    <div className="container">
      <div className="header">
        <h1>🎬 Cinema Booking</h1>
        <p>{subtitle || 'Book your tickets online, enjoy your movie!'}</p>
      </div>

      {currentStep > 0 && (
        <div className="progress-bar">
          {steps.map((step) => (
            <div 
              key={step.id} 
              className={`progress-step ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}
            >
              <div className="progress-circle">
                {currentStep > step.id ? '✓' : step.id}
              </div>
              <div className="progress-label">{step.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="content">
        {title && <h2>{title}</h2>}
        {children}
      </div>
    </div>
  );
};

export default Layout;
