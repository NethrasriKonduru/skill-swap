import { Coins } from "lucide-react";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-brand">
            <div className="footer-logo">
              <div className="footer-logo-icon">
                <Coins className="w-6 h-6 text-white" />
              </div>
              <span className="footer-logo-text">Skill Swap</span>
            </div>
            <p className="footer-description">
              Exchange skills, earn points, and learn together.
            </p>
          </div>
          
          {/* Platform */}
          <div className="footer-section">
            <h4>Platform</h4>
            <ul className="footer-links">
              <li><a href="#">Browse Courses</a></li>
              <li><a href="#">How It Works</a></li>
              <li><a href="#">Pricing</a></li>
            </ul>
          </div>
          
          {/* Support */}
          <div className="footer-section">
            <h4>Support</h4>
            <ul className="footer-links">
              <li><a href="#">Help Center</a></li>
              <li><a href="#">Contact Us</a></li>
              <li><a href="#">FAQ</a></li>
            </ul>
          </div>
          
          {/* Legal */}
          <div className="footer-section">
            <h4>Legal</h4>
            <ul className="footer-links">
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">Cookie Policy</a></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>© 2025 Skill Swap. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
