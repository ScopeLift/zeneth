import Link from 'next/link';

const Index = () => {
  const buttonClass =
    'mt-10 p-5 cursor-pointer text-xl bg-gradient-to-br from-red-300 to-purple-200 rounded opacity-90 hover:opacity-100';
  return (
    <div className="flex flex-row">
      <Link href="/l2-entry">
        <div className={`${buttonClass} mr-3`}>Gasless L2 Entry</div>
      </Link>
      <Link href="/token-transfer">
        <div className={buttonClass}>Gasless Token Transfer</div>
      </Link>
    </div>
  );
};

export default Index;
