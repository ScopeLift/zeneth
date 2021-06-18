import { ArrowCircleRightIcon } from '@heroicons/react/outline';
import Link from 'next/link';

const Index = () => {
  return (
    <div className="flex flex-row">
      {/* <Link href="/l2-entry"> */}
      <div className="mt-10 p-5 cursor-default rounded bg-gray-200 text-gray-600 text-xl mr-3 flex flex-col align-middle">
        Gasless L2 Entry <br />
        <span className="text-sm text-center block">(Coming soon)</span>
      </div>
      {/* </Link> */}
      <Link href="/token-transfer">
        <div className="mt-10 p-5 py-7 flex flex-row self-center align-middle cursor-pointer text-xl bg-gradient-to-br from-purple-200 via-red-200 to-transparent rounded opacity-90 hover:opacity-100">
          <div>Gasless Token Transfer</div>
          <ArrowCircleRightIcon className="ml-2 mt-1 h-5 w-5" />
        </div>
      </Link>
    </div>
  );
};

export default Index;
