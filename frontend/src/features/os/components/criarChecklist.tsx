
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";


export default function Vistoria() {
  
  const navigate = useNavigate();
  const handleClick = () => {
    navigate("/os/vistorias");
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleClick}
    >
    </Button>
  );
}
