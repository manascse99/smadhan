import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Signup = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate("/auth");
  }, [navigate]);

  return null;
};

export default Signup;
