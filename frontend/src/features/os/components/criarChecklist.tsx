import React, { useReducer } from "react";

type State = { count: number };
type Action =
  | { type: "increment" }
  | { type: "decrement" }
  | { type: "reset" };

const initialState: State = { count: 0 };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "increment":
      return { count: state.count + 1 };
    case "decrement":
      return { count: state.count - 1 };
    case "reset":
      return { count: 0 };
    default:
      return state;
  }
}

export default function ReducerExemple() {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <div>
      <p>Contagem: {state.count}</p>
      <button onClick={() => dispatch({ type: "increment" })}>+</button>
      <button onClick={() => dispatch({ type: "decrement" })}>-</button>
      <button onClick={() => dispatch({ type: "reset" })}>Reset</button>
    </div>
  );
}

// --- Mais um Exemplo de Reducer ---

// import React, { useReducer } from "react";

// // Tipo do item
// type Item = {
//   id: number;
//   name: string;
//   price: number;
//   quantity: number;
// };

// // Estado inicial
// type State = {
//   cart: Item[];
// };

// const initialState: State = { cart: [] };

// // Tipos de ação
// type Action =
//   | { type: "add"; payload: Item }
//   | { type: "remove"; payload: { id: number } }
//   | { type: "clear" }
//   | { type: "increment"; payload: { id: number } }
//   | { type: "decrement"; payload: { id: number } };

// // Reducer
// function cartReducer(state: State, action: Action): State {
//   switch (action.type) {
//     case "add":
//       return { cart: [...state.cart, action.payload] };

//     case "remove":
//       return { cart: state.cart.filter(item => item.id !== action.payload.id) };

//     case "clear":
//       return { cart: [] };

//     case "increment":
//       return {
//         cart: state.cart.map(item =>
//           item.id === action.payload.id
//             ? { ...item, quantity: item.quantity + 1 }
//             : item
//         ),
//       };

//     case "decrement":
//       return {
//         cart: state.cart.map(item =>
//           item.id === action.payload.id && item.quantity > 1
//             ? { ...item, quantity: item.quantity - 1 }
//             : item
//         ),
//       };

//     default:
//       return state;
//   }
// }

// // Componente principal
// export default function App() {
//   const [state, dispatch] = useReducer(cartReducer, initialState);

//   return (
//     <div>
//       <h2>Carrinho</h2>
//       <button
//         onClick={() =>
//           dispatch({
//             type: "add",
//             payload: { id: 1, name: "Camiseta", price: 50, quantity: 1 },
//           })
//         }
//       >
//         Adicionar Camiseta
//       </button>

//       <button onClick={() => dispatch({ type: "clear" })}>
//         Limpar carrinho
//       </button>

//       <ul>
//         {state.cart.map(item => (
//           <li key={item.id}>
//             {item.name} - {item.quantity} x R${item.price}
//             <button onClick={() => dispatch({ type: "increment", payload: { id: item.id } })}>+</button>
//             <button onClick={() => dispatch({ type: "decrement", payload: { id: item.id } })}>-</button>
//             <button onClick={() => dispatch({ type: "remove", payload: { id: item.id } })}>Remover</button>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }
