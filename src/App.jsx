import React from "react";
import Navbar from "./components/Navbar";
import AboutMe from "./components/AboutMe";
import Footer from "./components/Footer";
import ContactPage from "./components/ContactPage";
import Services from "./components/Services";
import "./App.css";
import Hero from "./components/Hero";

function App() {
  return (
    <>
      <div className="App-content">
        <Navbar />
        <Hero />
        <Services />
        <AboutMe />
        <ContactPage />
        <Footer />
      </div>
    </>
  );
}

export default App;
