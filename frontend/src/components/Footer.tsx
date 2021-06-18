export const Footer = () => {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-center">
        Created by{' '}
        <a href="https://scopelift.co" rel="noreferrer" target="_blank" className="text-blue-800">
          ScopeLift
        </a>
      </div>
      <a href="/static/docs/Zeneth-Privacy-Policy-061621.pdf" target="_blankd" className="text-blue-800">
        Privacy Policy
      </a>{' '}
      |{' '}
      <a href="/static/docs/Zeneth-Terms-of-Service-061621.pdf" target="_blankd" className="text-blue-800">
        Terms of Service
      </a>{' '}
      |{' '}
      <a href="mailto:support@zeneth.app" className="text-blue-800">
        support@zeneth.app
      </a>
      <div className="flex items-center justify-center">
        <small>
          Icon by{' '}
          <a
            href="https://www.flaticon.com/authors/good-ware"
            target="_blankd"
            className="text-blue-800"
            title="Good Ware"
          >
            Good Ware
          </a>
        </small>
      </div>
    </div>
  );
};

export default Footer;
