import { useEffect, useRef } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa"; // Import arrow icons

const SlotSelector = ({ docSlots, slotIndex, slotTime, setSlotTime }) => {
  const containerRef = useRef(null);

  // Auto-scroll to last item on load
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = containerRef.current.scrollWidth;
    }
  }, [docSlots]);

  // Function to scroll left
  const scrollLeft = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({
        left: containerRef.current.scrollLeft > 0 && -200,
        behavior: "smooth",
      });
    }
  };

  // Function to scroll right
  const scrollRight = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  return (
    <div className="flex items-center relative w-full mt-4">
      {/* Left Arrow Button */}
      <div className="flex mr-2">
        <button
          className="p-2 bg-gray-100 rounded-full shadow-md hover:bg-gray-300 transition"
          onClick={scrollLeft}
        >
          <FaChevronLeft size={15} />
        </button>
      </div>

      {/* Scrollable Slots Container */}

      <div className="overflow-x-hidden">
        <div
          ref={containerRef}
          className="flex items-center gap-2 w-full overflow-x-auto snap-x snap-mandatory py-1 scrollbar-hide"
        >
          {docSlots.length > 0 &&
            docSlots[slotIndex].map((item, index) => (
              <button
                type="button"
                onClick={() => item.time && setSlotTime(item.time)}
                disabled={!item.time}
                className={`text-xs flex-shrink-0 px-3 py-1.5 rounded-full snap-end transition ${
                  item.time === slotTime
                    ? "bg-primary text-white"
                    : item.time
                      ? "text-gray-500 border border-gray-300 hover:border-primary"
                      : "text-gray-300 border border-gray-200 cursor-not-allowed"
                }`}
                key={index}
              >
                {item.time === false ? "No slot" : item?.time?.toLowerCase()}
              </button>
            ))}
        </div>
      </div>

      {/* Right Arrow Button */}
      <div className="flex ml-2">
        <button
          className=" p-2 bg-gray-100 rounded-full shadow-md hover:bg-gray-300 transition "
          onClick={scrollRight}
        >
          <FaChevronRight size={15} />
        </button>
      </div>
    </div>
  );
};

export default SlotSelector;
