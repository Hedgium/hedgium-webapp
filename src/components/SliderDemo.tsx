import Slider from "./Slider";

export default function SliderDemo() {
  return (
    <div className="px-6">
    <Slider>
      {[...Array(10)].map((_, i) => (
        <div
          key={i}
          className="snap-start shrink-0 w-[85%] sm:w-[45%] md:w-[30%] lg:w-[23%] 
                     bg-base-200 rounded-2xl shadow-md p-6"
        >
          <h2 className="text-lg font-bold">Card {i + 1}</h2>
          <p className="text-sm opacity-80">This is card content.</p>
        </div>
      ))}
    </Slider>
    </div>
  );
}
