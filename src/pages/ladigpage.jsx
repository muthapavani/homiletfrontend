import React from "react";
import HeroSection from "../landing_page/nav/nav";
import Cards from "../landing_page/cards/card";
import Carousels from "../landing_page/corousel/corousel";
import LandCards from "../landing_page/cards/cardsl";
import Features from "../landing_page/features/features";
import Footer from "../landing_page/footer/footer";
const Landing=()=>{
    return(
        <>
        <HeroSection></HeroSection>
        <Cards></Cards>
        <Carousels></Carousels>
        <LandCards></LandCards>
        <Features></Features>
        <Footer></Footer>

        </>
    )
}
 export default Landing
