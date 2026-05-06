import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"; // Import FontAwesomeIcon for social media icons
import {
  faTwitter,
  faLinkedin,
  faGithub,
  faMedium,
} from "@fortawesome/free-brands-svg-icons"; // Import specific brand icons

const Footer = () => {
  return (
    <div className="px-4 sm:px-20 bg-gray-900 py-10 text-white flex flex-col sm:flex-row justify-between items-center text-center sm:text-left">
      <div className="mb-6 sm:mb-0">
        <h1 className="font-extrabold text-3xl mb-4">LinkLytics</h1>

        <p className="text-sm font-light mb-2">
          A product by{" "}
          <span className="text-blue-500 font-medium">
            <a
              href="https://www.linkedin.com/in/dpgaharwal/"
              className="hover:underline"
            >
              Durga Prasad
            </a>
          </span>
        </p>

        {/* Social media icons */}
        <div className="flex justify-center mt-6 space-x-6">
          <a
            href="https://x.com/happy"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FontAwesomeIcon
              icon={faTwitter}
              size="2x"
              className="text-blue-500 hover:text-white transition"
            />
          </a>
          <a
            href="https://www.linkedin.com/in/dpgaharwal/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FontAwesomeIcon
              icon={faLinkedin}
              size="2x"
              className="text-blue-500 hover:text-white transition"
            />
          </a>
          <a
            href="https://github.com/dpgaharwal"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FontAwesomeIcon
              icon={faGithub}
              size="2x"
              className="text-blue-500 hover:text-white transition"
            />
          </a>
          <a
            href="https://medium.com/@dpgaharwal"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FontAwesomeIcon
              icon={faMedium}
              size="2x"
              className="text-blue-500 hover:text-white transition"
            />
          </a>
        </div>
      </div>

      <div className="text-center sm:text-right mt-6 sm:mt-0">
        <p className="text-lg font-bold mb-1">URL Shortener with Analytics</p>
        <p className="text-sm text-gray-400">
          Transforming long URLs into short links while providing valuable
          insights.
        </p>
        <p className="text-sm mt-2">
          &copy; {new Date().getFullYear()} LinkLytics. All rights reserved.{" "}
          {/* Display current year */}
        </p>
      </div>
    </div>
  );
};

export default Footer;
