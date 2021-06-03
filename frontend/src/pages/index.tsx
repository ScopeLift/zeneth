import Link from 'next/link';

const Index = () => {
  const buttonClass =
    'mt-10 p-5 py-7 flex self-center align-middle cursor-pointer text-xl bg-gradient-to-br from-red-300 to-purple-400 rounded opacity-90 hover:opacity-100';
  return (
    <div className="flex flex-row">
      {/* <Link href="/l2-entry"> */}
      <div className="mt-10 p-5 cursor-default rounded bg-gray-200 text-gray-600 text-xl mr-3 flex flex-col align-middle">
        Gasless L2 Entry <br />
        <span className="text-sm text-center block">(Coming soon)</span>
      </div>
      {/* </Link> */}
      <Link href="/token-transfer">
        <div className={buttonClass}>Gasless Token Transfer</div>
      </Link>
    </div>
  );
};

export default Index;
