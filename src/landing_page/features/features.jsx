import React from "react";
import "./features.css";

const Features = () => {
  const features = [
    {
      id: 1,
      title: "Tenant Management",
      description: "Easily manage tenant information, applications, and communications in one place.",
      icon: "👨‍👩‍👧‍👦",
    },
    {
      id: 2,
      title: "Maintenance Tracking",
      description: "Streamline maintenance requests, track repairs, and keep property records organized.",
      icon: "🔧",
    },
    {
      id: 3,
      title: "Rent Management",
      description: "Manage rent collection efficiently with automated reminders and financial reports.",
      icon: "🏠",
    },
    {
      id: 4,
      title: "Property Listings",
      description: "Showcase available properties with detailed descriptions, images, and pricing.",
      icon: "📢",
    },
    {
      id: 5,
      title: "24/7 Customer Support",
      description: "Get round-the-clock assistance for tenants and landlords whenever needed.",
      icon: "🛎️",
    },
    {
      id: 6,
      title: "Online Payment Integration",
      description: "Enable tenants to pay rent seamlessly via multiple payment options.",
      icon: "💳",
    },
  ];

  return (
    <section id="features" className="features">
      <div className="features-header">
        <h2 className="title">Key Features</h2>
        <p className="subtitle">Everything you need to manage your properties efficiently</p>
      </div>

      <div className="feature-container">
        {features.map((feature) => (
          <div key={feature.id} className="feature-card">
            <div className="icon">{feature.icon}</div>  
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Features;
