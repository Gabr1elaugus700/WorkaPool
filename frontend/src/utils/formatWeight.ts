const formatWeight = (value: number) => {
    return `${value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} kg`;
  };

export default formatWeight;