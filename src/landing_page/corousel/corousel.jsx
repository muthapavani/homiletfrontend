import React from "react";
import { Carousel } from "react-bootstrap";
import "./corousel.css"; 

import homesImg from "../../assets/landingimg/homes.jpeg";
import landsImg from "../../assets/landingimg/lands.jpg";
import maintenanceImg from "../../assets/landingimg/main.jpg";



const Carousels = () => {
  return (<>
  <h2 className="text-center mt-3">Explore Our Listings</h2>
    <section className="carousel-section">
      <Carousel fade>
        <Carousel.Item>
          <img className="d-block w-100" src={homesImg} alt="Homes" />
          <Carousel.Caption>
            <h3>Find Your Dream Home</h3>
            <p>Explore the best apartments, villas, and houses.</p>
          </Carousel.Caption>
        </Carousel.Item>

        <Carousel.Item>
          <img className="d-block w-100" src={landsImg} alt="Lands" />
          <Carousel.Caption>
            <h3>Invest in Prime Lands</h3>
            <p>Secure the perfect plot for your future projects.</p>
          </Carousel.Caption>
        </Carousel.Item>

        <Carousel.Item>
          <img className="d-block w-100" src={maintenanceImg} alt="Maintenance" />
          <Carousel.Caption>
            <h3>Property Maintenance Services</h3>
            <p>Keep your property in top condition with our expert services.</p>
          </Carousel.Caption>
        </Carousel.Item>
      </Carousel>
    </section></>
  );
};

export default Carousels;
