import Link from 'next/link';

const Index = () => {
  const buttonClass = 'p-5 cursor-pointer text-xl bg-gradient-to-r from-green-200 to-purple-200 rounded';
  return (
    <div className="flex flex-row">
      <Link href="/l2-entry">
        <div className="p-5 cursor-pointer text-xl bg-gradient-to-r from-green-200 to-purple-200 rounded text-center mr-3">
          Gasless L2 Entry
        </div>
      </Link>
      <Link href="/token-transfer">
        <div className={buttonClass}>Gasless Token Transfer</div>
      </Link>
    </div>
  );
};

export default Index;
