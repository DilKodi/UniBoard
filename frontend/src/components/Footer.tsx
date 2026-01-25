const Footer = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="text-2xl font-bold text-blue-700 mb-4">
              UniBoard
            </div>
            <p className="text-gray-600 text-sm">
              UniBoard is the most verified and trusted student-centric boarding
              platform.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">For Students</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <a href="#" className="hover:text-blue-700">
                  Browse Listings
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-700">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-700">
                  Student FAQ
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">For Owners</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <a href="#" className="hover:text-blue-700">
                  List Your Property
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-700">
                  Property Management
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-700">
                  Owner FAQ
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>hello@uniboard.com</li>
              <li>+1 234 567 890</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-600">
            © 2026 UniBoard. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-sm text-gray-600 hover:text-blue-700">
              Privacy Policy
            </a>
            <a href="#" className="text-sm text-gray-600 hover:text-blue-700">
              Terms of Service
            </a>
            <a href="#" className="text-sm text-gray-600 hover:text-blue-700">
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
