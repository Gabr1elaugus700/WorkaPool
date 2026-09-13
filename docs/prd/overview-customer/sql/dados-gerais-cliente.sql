-- Var
DECLARE @CodCli INT;

-- Values
SET @CodCli = 123;

-- Query
SELECT 
	cli.codcli AS CODIGO,
	cli.apecli AS NOME,
	cli.cgccpf AS CNPJ_CPF,
	cli.tipcli AS TIPO_CLI, 
	cli.cidcli AS CIDADE,
	cli.sigufs AS UF,
	ram.desram AS SEGMENTO,
	cli.datcad AS DATA_CADASTRO,
	(
		SELECT TOP 1 n.datemi
		FROM e140nfv n 
		WHERE cli.codcli = n.codcli
		ORDER BY n.datemi DESC
	) AS ULTIMA_COMPRA, 
	(
		SELECT TOP 1 n.datemi
		FROM e140nfv n 
		WHERE cli.codcli = n.codcli
		ORDER BY n.datemi ASC
	) AS PRIMEIRA_COMPRA, 
	(
		SELECT TOP 1 n.codrep
		FROM e140nfv n
		WHERE cli.codcli = n.codcli
		GROUP BY n.codrep
		ORDER BY count(*) DESC	
	) AS VENDEDOR	
FROM e085cli cli 
INNER JOIN e026ram ram ON ram.codram = cli.codram
WHERE cli.codcli = @CodCli