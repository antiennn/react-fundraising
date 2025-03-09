import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { FaUserSecret } from "react-icons/fa6";
import { FaPaperPlane } from "react-icons/fa";
import moment from "moment";
import { ToastContainer, toast } from 'react-toastify';
import Swal from "sweetalert2";
import { useStateContext } from '../context';
import { CountBox, CustomButton, Loader } from '../components';
import { calculateBarPercentage, daysLeft } from '../utils';
import { loader, thirdweb } from '../assets';

const CampaignDetails = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { donate, getDonations, contract, address, getCommentCompaign, sendCommentCompaign } = useStateContext();

  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [donators, setDonators] = useState([]);
  const [comments, setComments] = useState([]);
  const [lastCreatedAt, setLastCreatedAt] = useState("")
  const [currentComment, setCurrentComment] = useState("")
  const [isLoadingComment, setIsLoadingComment] = useState(true)
  const [isDoneLoadingMore, setIsDoneLoadingMore] = useState(false)

  const remainingDays = daysLeft(state.deadline);

  const fetchDonators = async () => {
    const data = await getDonations(state.pId);

    setDonators(data);
  }

  useEffect(() => {
    if (contract) fetchDonators();
  }, [contract, address])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getCommentCompaign(state.title, lastCreatedAt);
        if(data){
          setComments((prev) => [...prev, ...data] );
        }        
        else{
          setIsDoneLoadingMore(true)
        }
        setIsLoadingComment(false)
      } catch (error) {
        console.error("Error fetching comments:", error);
      }
    };

    fetchData();
  }, [lastCreatedAt]);

  const handleLoadMoreComment = () => {
    setIsLoadingComment(true);
    
    setLastCreatedAt(comments.at(-1).CreatedAt);
  }

  const handleSubmit = async () => {
    if (!address) {
      toast.error("Please log in with your MetaMask wallet!!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      return
    }
    if (!currentComment.trim()) {
      toast.error("Leave a Comment!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      return
    };

    const newComment = {
      user_id: address,
      post_id: state.title,
      content: currentComment,
    };

    let response = await sendCommentCompaign(newComment)
    if (response.status == "201") {
      Swal.fire({
        title: "Success!",
        text: "Your comment has been posted.",
        icon: "success",
        confirmButtonText: "OK",
        timer: 2000,
      });
      setComments((prev) => [ response.data,...prev])
    }
    setCurrentComment("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleDonate = async () => {
    setIsLoading(true);

    await donate(state.pId, amount);

    navigate('/')
    setIsLoading(false);
  }

  return (
    <div>
      {isLoading && <Loader />}
      <ToastContainer />
      <div className="w-full flex md:flex-row flex-col mt-10 gap-[30px]">
        <div className="flex-1 flex-col">
          <img src={state.image} alt="campaign" className="w-full h-[410px] object-cover rounded-xl" />
          <div className="relative w-full h-[5px] bg-[#3a3a43] mt-2">
            <div className="absolute h-full bg-[#4acd8d]" style={{ width: `${calculateBarPercentage(state.target, state.amountCollected)}%`, maxWidth: '100%' }}>
            </div>
          </div>
        </div>

        <div className="flex md:w-[150px] w-full flex-wrap justify-between gap-[30px]">
          <CountBox title="Days Left" value={remainingDays} />
          <CountBox title={`Raised of ${state.target}`} value={state.amountCollected} />
          <CountBox title="Total Backers" value={donators.length} />
        </div>
      </div>

      <div className="mt-[60px] flex lg:flex-row flex-col gap-5">
        <div className="flex-[2] flex flex-col gap-[40px]">
          <div>
            <h4 className="font-epilogue font-semibold text-[18px] text-white uppercase">Creator</h4>

            <div className="mt-[20px] flex flex-row items-center flex-wrap gap-[14px]">
              <div className="w-[52px] h-[52px] flex items-center justify-center rounded-full bg-[#2c2f32] cursor-pointer">
                <img src={thirdweb} alt="user" className="w-[60%] h-[60%] object-contain" />
              </div>
              <div>
                <h4 className="font-epilogue font-semibold text-[14px] text-white break-all">{state.owner}</h4>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-epilogue font-semibold text-[18px] text-white uppercase">Story</h4>

            <div className="mt-[20px]">
              <p className="font-epilogue font-normal text-[16px] text-[#808191] leading-[26px] text-justify">{state.description}</p>
            </div>
          </div>

          <div>
            <h4 className="font-epilogue font-semibold text-[18px] text-white uppercase">Donators</h4>

            <div className="mt-[20px] flex flex-col gap-4">
              {donators.length > 0 ? donators.map((item, index) => (
                <div key={`${item.donator}-${index}`} className="flex justify-between items-center gap-4">
                  <p className="font-epilogue font-normal text-[16px] text-[#b2b3bd] leading-[26px] break-ll">{index + 1}. {item.donator}</p>
                  <p className="font-epilogue font-normal text-[16px] text-[#808191] leading-[26px] break-ll">{item.donation}</p>
                </div>
              )) : (
                <p className="font-epilogue font-normal text-[16px] text-[#808191] leading-[26px] text-justify">No donators yet. Be the first one!</p>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-epilogue font-semibold text-[18px] text-white uppercase">Comment</h4>
            <div className='flex justify-between items-center mt-4 py-2 px-4 border-gray-600 border rounded-lg bg-[#1c1c24]'>
              <input
                type="text"
                value={currentComment}
                onChange={(e) => setCurrentComment(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Write your comment..."
                className="flex-1 pr-10 py-2 border rounded-md text-white bg-transparent border-none outline-none"
              />
              <button
                type="button"
                onClick={handleSubmit}
                className="bg-[#8c6dfd] text-white p-2 w-20 flex justify-center items-center rounded-md"
              >
                <FaPaperPlane size={18} />
              </button>
            </div>
            <div className="my-[40px] flex flex-col gap-4 max-h-80 overflow-auto 
                scrollbar-none">

              {comments && comments.length > 0 ? (
                comments.map((item, index) => (
                  <div key={item.ID} className="flex items-center gap-4 relative">
                    <FaUserSecret className='w-10 h-10' color='white' />
                    <div className='w-full'>
                      <p className="font-epilogue font-semibold text-[18px] text-[#8c6dfd] leading-[26px] break-words">
                        {item.UserID}
                      </p>
                      <p className="w-4/5 font-epilogue font-normal text-[16px] text-white leading-[26px] break-words">
                        {item.Content}
                      </p>
                    </div>
                    <p className='text-white text-[16px] capitalize absolute right-0'>{moment(item.CreatedAt).fromNow()}</p>
                  </div>
                ))
              ) : (
                <p className="font-epilogue font-normal text-[16px] text-[#808191] leading-[26px] text-justify">
                  No comments yet. Be the first one!
                </p>
              )}
              {isLoadingComment && <div className='flex justify-center items-center'> <img src={loader} alt="loader" className="w-[100px] h-[100px] object-contain"/></div>}
              {comments && !isDoneLoadingMore && <p className='text-gray-400 flex justify-center items-center cursor-pointer' onClick={handleLoadMoreComment}>Load more comments</p>}

            </div>
          </div>
        </div>

        <div className="flex-1">
          <h4 className="font-epilogue font-semibold text-[18px] text-white uppercase">Fund</h4>

          <div className="mt-[20px] flex flex-col p-4 bg-[#1c1c24] rounded-[10px]">
            <p className="font-epilogue fount-medium text-[20px] leading-[30px] text-center text-[#808191]">
              Fund the campaign
            </p>
            <div className="mt-[30px]">
              <input
                type="number"
                placeholder="ETH 0.1"
                step="0.01"
                className="w-full py-[10px] sm:px-[20px] px-[15px] outline-none border-[1px] border-[#3a3a43] bg-transparent font-epilogue text-white text-[18px] leading-[30px] placeholder:text-[#4b5264] rounded-[10px]"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />

              <div className="my-[20px] p-4 bg-[#13131a] rounded-[10px]">
                <h4 className="font-epilogue font-semibold text-[14px] leading-[22px] text-white">Back it because you believe in it.</h4>
                <p className="mt-[20px] font-epilogue font-normal leading-[22px] text-[#808191]">Support the project for no reward, just because it speaks to you.</p>
              </div>

              <CustomButton
                btnType="button"
                title="Fund Campaign"
                styles="w-full bg-[#8c6dfd]"
                handleClick={handleDonate}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CampaignDetails