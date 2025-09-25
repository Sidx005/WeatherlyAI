import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaAngleRight } from "react-icons/fa";
import Navbar from "./Navbar";

const Home = () => {
  const [index, setIndex] = useState(0);
  const images = ["Sunny.png", "Rainy.png"];

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % images.length); // cycle through images
    }, 3000); // change every 3 seconds

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="min-h-screen w-full py-20 flex flex-col items-center gap-3 justify-center relative [background-image:url('/Bg.svg')] bg-cover bg-center bg-no-repeat">
      <Navbar />

      <h1 className="text-4xl md:text-6xl font-normal  text-gray-800 tracking-wide mt-8">
        Weatherly<span className="text-indigo-500">.ai</span>
      </h1>
      <p className="font-semibold leading-relaxed tracking-wide  text-slate-500">Get the latest weather updates</p>

      <Link
        to="/chat"
        className="flex gap-3 hover:underline px-4 py-2 rounded-md bg-indigo-600 text-white items-center hover:bg-indigo-700 transition-colors"
      >
        Get Started <FaAngleRight />
      </Link>

      {/* Image carousel */}
      <div className="relative overflow-hidden h-64 w-64 mt-12 flex items-center justify-center rounded-2xl   backdrop-blur-md  ">
        {images.map((img, i) => (
          <img
            key={i}
            src={img}
            alt="weather"
            className={`absolute w-full h-full object-contain transition-all duration-700 ease-in-out
              ${i === index ? "opacity-100 scale-100 z-10" : "opacity-0 scale-90 z-0"}`}
          />
        ))}
      </div>
    </div>
  );
};

export default Home;
