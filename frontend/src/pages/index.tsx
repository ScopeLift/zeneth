import Header from 'components/Header';
import ERC20Form from 'components/ERC20Form';
// import L2Form from 'components/L2Form';
import Footer from 'components/Footer';

const Index = () => {
  return (
    <div className="flex flex-col items-center">
      <div className="my-5">
        <Header />
      </div>
      <div className="my-5">
        <ERC20Form />
      </div>
      {/* <L2Form /> */}
      <div className="my-5">
        <Footer />
      </div>
    </div>
  );
};

export default Index;
