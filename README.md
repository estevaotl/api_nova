# Projeto para captura de dados do cnpj dos sites

## Descrição do Projeto
- Projeto realizado para captura de informações juridicas dos sites, como CNPJ, endereço etc.
- Após a captura desses dados, validamos eles na receita federal, para verificar se as informações batem com o que foi cadastrado, a fim de evitar que os consumidores caiam em golpes.
- Por fim, é gerado um html de saída com um score de acordo com a quantidade de dados válidos.

## Tecnologias Utilizadas
- Javascript
- Puppeterr para captura das informações

### Procedimento para utilização

- Realizar download do NODEJS
- Siga o tutorial abaixo conforme versão do sistema operacional antes de clonar o repositorio do GitHub. Lembrando que a versão do NodeJs deve ser acima da 14.<br>

#### Linux *( testada na versão do Ubuntu 22.04.1 LTS )*

- Utilize o passo a passo desse tutorial. https://computingforgeeks.com/how-to-install-node-js-on-ubuntu-debian/
- Prefira o *Method 2) Install Node.js and npm using NVM* do link acima ( METODO TESTADO E FUNCIONANDO )

#### Windows *( Prefira a versão LTS sempre)*
- Basta entrar no link e baixar a versão LTS
  - https://nodejs.org/en/download/
- Apos a instalação do NodeJs e o clonar o repositorio do GitHub, rodar os comandos abaixo no Visual Studio Code:
  - *npm init*
  - *npm i puppeteer*
  - *npm i node-fetch* -> site para conferencia ( https://www.npmjs.com/node-fetch )
  - *npm i readline* -> site para conferencia ( https://www.npmjs.com/package/readline )
  - *npm i fs* -> site para conferencia ( https://www.npmjs.com/package/fs )
  - *npm i open* -> site para conferencia ( https://www.npmjs.com/package/open ) <br><br>

#### Apos isso, faça a inserção do codigo abaixo conforme a imagem do repositorio *"imagem_config_package.png"*

    "type": "module"

#### Apos isso, abrir o terminal do visual studio code ( https://code.visualstudio.com/download ) e digitar o codigo abaixo

    node index.js


#### Sites para conferencia dos repositorios utilizados do npm 

* *puppeteer -> site para conferencia (https://www.npmjs.com/package/puppeteer)*<br>
* *node-fetch* -> site para conferencia ( https://www.npmjs.com/node-fetch ) <br>
* *readline* -> site para conferencia ( https://www.npmjs.com/package/readline ) <br>
* *fs* -> site para conferencia ( https://www.npmjs.com/package/fs ) <br>
* *open* -> site para conferencia ( https://www.npmjs.com/package/open ) <br><br>
