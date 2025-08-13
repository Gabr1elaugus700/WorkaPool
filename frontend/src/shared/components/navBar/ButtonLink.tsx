import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";

interface ButtonLinkProps {
    to: string;
    children: string;
    allowedRoles?: string[];
}

export default function ButtonLink({ to, children, allowedRoles }: ButtonLinkProps) {
    const { user } = useAuth();
    
    // Se não há roles definidas, mostra para todos os usuários logados
    if (!allowedRoles || allowedRoles.length === 0) {
        return (
            <Button asChild variant="link" className="text-primary-foreground">
                <Link to={to}>{children}</Link>
            </Button>
        );
    }
    
    // Verifica se o usuário tem uma das roles permitidas
    const hasPermission = user?.role && allowedRoles.includes(user.role);
    
    // Se não tem permissão, não renderiza nada
    if (!hasPermission) {
        return null;
    }

    return (
        <Button asChild variant="link" className="text-primary-foreground">
            <Link to={to}>{children}</Link>
        </Button>
    );
}