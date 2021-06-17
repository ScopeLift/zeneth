export const Footer = () => {
  return (
    <div className="mb-4">
      <center>
        Created by{' '}
        <a href="https://scopelift.co" rel="noreferrer" target="_blank" className="text-purple-800">
          ScopeLift
        </a>
      </center>
      <a href="/static/docs/Zeneth-Privacy-Policy-061621.pdf" target="_blankd" className="text-purple-800">
        Privacy Policy
      </a>{' '}
      |{' '}
      <a href="/static/docs/Zeneth-Terms-of-Service-061621.pdf" target="_blankd" className="text-purple-800">
        Terms of Service
      </a>{' '}
      |{' '}
      <a href="mailto:support@zeneth.app" className="text-purple-800">
        support@zeneth.app
      </a>
      <center>
        <small>
          Icon by{' '}
          <a
            href="https://www.flaticon.com/authors/good-ware"
            target="_blankd"
            className="text-purple-800"
            title="Good Ware"
          >
            Good Ware
          </a>
        </small>
      </center>
    </div>
  );
};

export default Footer;
