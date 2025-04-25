import { ComponentProps } from 'react';
import { CheckCircle} from 'lucide-react'

export type ButtonProps =  ComponentProps<'button'> & {
    success?: boolean;
}

export function Button({success = false, ...props}: ButtonProps) {
    return (
        <button 
        data-success={success}
        className="flex h-10 items-center justify-center bg-blue-800 rounded text-zinc-100 px-4 py-1.5 text-sm data-[success=true]:bg-emerald-500
        " {...props}>
            {success ? <CheckCircle className="  w-4 h-4 mr-2" /> : props.children }
            
        </button>
    )
}