import { Pencil } from "lucide-react";

interface EditarOsProps {
    idOs?: string;
}

export const EditarOs = ({ idOs }: EditarOsProps) => {

    const handleEdit = () => {
        alert(`Editando OS: ${idOs}`);
    };

    return (
        <Pencil 
            className="w-8 h-8 md:h-5 md:w-5 text-primary hover:opacity-70 cursor-pointer"
            onClick={handleEdit}
        />
    );
};
