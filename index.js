import fetch from "node-fetch";
import pupp from 'puppeteer';
import readline from 'readline';
import fs from 'fs';
import open from 'open';

const padraoCNPJ = /([0-9]{2}\.?[0-9]{3}\.?[0-9]{3}\/?[0-9]{4}\-?[0-9]{2})/;
const padraoCEP = /([0-9]{2}\.?[0-9]{3}\-?[0-9]{3})/;
const padraoData = /([0-9]{2}\/[0-9]{2}\/[0-9]{4})/gm;
const baseDiasConfiaveisCriacaoDominio = 1.825;

const urlSite =  await promptSite('Digite a url do site com o prefiro www( exemplo www.netshoes.com.br )?');
const urlCompleta = "https://" + urlSite;

const variavelSaida = 0;

( async() => {    
    let browser; 
    let browser2;   
    try {

        browser = await pupp.launch({
            headless: false,
            ignoreHTTPSErrors: true
        });

        browser2 = await pupp.launch({
            headless: false,
            ignoreHTTPSErrors: true
        });

        const page = await browser.newPage(); 
        page.setDefaultNavigationTimeout(0);  
        await page.goto(urlCompleta);  

        let dataCriacaoDominioNaoEncontrada = false;
        let diferencaDias = 0;

        const page1 = await browser2.newPage();
        let dataCriacaoDominio = await buscarDataCriacaoDominio(page1, urlSite);
        let dataCriacaoDominioEncontrada = null;
        if ( dataCriacaoDominio == null || dataCriacaoDominio.includes("Consulta inválida") ) {
            dataCriacaoDominioNaoEncontrada = true;
        } else {
            dataCriacaoDominioEncontrada = dataCriacaoDominio.match(padraoData);
            if ( dataCriacaoDominioEncontrada[3] == null || dataCriacaoDominio.includes("Consulta inválida") ) {
                dataCriacaoDominioNaoEncontrada = true;
            }

            var dataAtual = new Date();  
            let dataDominioSeparada = dataCriacaoDominioEncontrada[3].split("/");
            var dataDominio = new Date(dataDominioSeparada[2], dataDominioSeparada[1], dataDominioSeparada[0]);  

            var time_difference = dataAtual.getTime() - dataDominio.getTime();  

            //calculate days difference by dividing total milliseconds in a day  
            diferencaDias = time_difference / (1000 * 60 * 60 * 24);  
        }

        const informacaoCNPJ = await buscarInformacoes ( page, 'CNPJ' );
        const informacaoEndereco = await buscarInformacoes ( page, 'Endereço' );
        const informacaoCEP = await buscarInformacoes ( page, 'CEP' );
        let informacaoTotal = informacaoCNPJ + " " + informacaoEndereco + " " + informacaoCEP;

        let informacaoCNPJEncontradaPeloEndereco = informacaoTotal.match(padraoCNPJ);
        let informacaoCNPJEncontradaPeloCEP = informacaoTotal.match(padraoCNPJ);
        let informacaoCNPJEncontradaPeloCNPJ = informacaoTotal.match(padraoCNPJ);

        let informacaoEncontradasSiteArray = "";
        let informacoesEncontradas = "";
        let cnpjEncontrado = "";
        let CNPJNaoEncontrado = false;
        let cepNaoEncontrado = false;
        let cepCorresponde = false;
        let scoreTotal = 0;

        // convertendo o objeto para array
        if ( informacaoCNPJEncontradaPeloEndereco != null ) {
            informacaoEncontradasSiteArray = Object.values(informacaoCNPJEncontradaPeloEndereco);
            informacoesEncontradas = informacaoCNPJEncontradaPeloEndereco;
            cnpjEncontrado = informacaoEncontradasSiteArray.find( value => padraoCNPJ.test(value) );
            scoreTotal += 20;
        } else if ( informacaoCNPJEncontradaPeloCEP != null ) {
            informacaoEncontradasSiteArray = Object.values(informacaoCNPJEncontradaPeloCEP);
            informacoesEncontradas = informacaoCNPJEncontradaPeloCEP;
            cnpjEncontrado = informacaoEncontradasSiteArray.find( value => padraoCNPJ.test(value) );
            scoreTotal += 20;
        } else if ( informacaoCNPJEncontradaPeloCNPJ != null ) {
            informacaoEncontradasSiteArray = Object.values(informacaoCNPJEncontradaPeloCNPJ);
            informacoesEncontradas = informacaoCNPJEncontradaPeloCNPJ;
            cnpjEncontrado = informacaoEncontradasSiteArray.find( value => padraoCNPJ.test(value) );
            scoreTotal += 20;
        } else {
            CNPJNaoEncontrado = true;
        }

        const informacaoReceitaFederal = await buscarInformacoesAPIReceita ( cnpjEncontrado );

        if ( informacaoReceitaFederal != null ) {
            scoreTotal += 20;
        }

        // verificar se as informações constam na string capturada do site

        const cnpjCorresponde = await compararInformacoes(informacaoReceitaFederal, informacoesEncontradas['input'], 'cnpj');
        if ( cnpjCorresponde ) {
            scoreTotal += 20;
        }

        const estadoCorresponde = await compararInformacoes(informacaoReceitaFederal, informacoesEncontradas['input'], 'estado');
        if( estadoCorresponde ) {
            scoreTotal += 8;
        }

        const numeroCorresponde = await compararInformacoes(informacaoReceitaFederal, informacoesEncontradas['input'], 'numero');
        if( numeroCorresponde ) {
            scoreTotal += 8;
        }

        const cidadeCorresponde = await compararInformacoes(informacaoReceitaFederal, informacoesEncontradas['input'], 'cidade');
        if( cidadeCorresponde ) {
            scoreTotal += 8;
        }

        const cepSiteEncontrado = informacoesEncontradas['input'].match(padraoCEP);
        if ( cepSiteEncontrado == null ) {
            cepNaoEncontrado = true;
        } else {
            const cepEncontradoSemTracosEPontos = cepSiteEncontrado[0].replace(/\.|\-/g, "");
            const cepReceitaSemTracosEPontos = informacaoReceitaFederal.cep.replace(/\.|\-/g, "");
            if ( cepEncontradoSemTracosEPontos == cepReceitaSemTracosEPontos )
                cepCorresponde = true;
            
            if( cepCorresponde ) {
                scoreTotal += 8;
            }
        }

        const htmlInicial = 
        `
            <!DOCTYPE html>
            <html lang="pt-br">
                <head>
                    <meta charset="UTF-8">
                    <meta http-equiv="X-UA-Compatible" content="IE=edge">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Document</title>
                </head>
                <body style="background-color: aliceblue; margin: 100px 100px 0px 100px;">
                    <h1 style="text-align: center; font: Arial 12px solid black;">SABE TUDO</h1>
                    <h2 style="text-align: center;">Site Buscado : ${urlCompleta}</h2>`;

        let bodyHTML = "";
        let footerHTML = "";

        if ( CNPJNaoEncontrado ) {
            bodyHTML = 
            `
                    <p>Informações relevantes a CNPJ não encontradas.</p>
                    <footer style="align-items: center;">
                            <h3>SCORE</h3>
                            <span> INFORMAÇÕES CADASTRADAS NA RECEITA: ❌ </span><br>
                            <span> Resultado : 0 <i title="Site não segue a lei do ecommerce. Não confiavel."></i></span>
                    </footer>
                </body>
            </html> 
            `;
        } else {
            bodyHTML = 
            `
            <div style="display: flex; align-items: center;">
                        <div style="margin-top: 10px; margin-right: 500px; margin-left: 200px;"> 
                            <h3 style="text-align: center;">Dados Capturados do Site</h3> 
                            <table style="border: 1px solid black; border-collapse: collapse; border-radius: 10px; width: 500px;">
                                <thead>
                                    <th style="background-color: aquamarine; vertical-align: middle;"> Dados </th>
                                </thead>
                                <tbody>
                                    <td style="border: 1px solid black; border-collapse: collapse; border-radius: 10px; height: 50px; vertical-align: middle; text-align: center; background-color: #ddd;"> ${informacoesEncontradas['input']} </td>
                            </table>
                        </div>

                        <div style="margin-top: 74px; margin-left: -200px;"> 
                            <h3 style="text-align: center;">Dados Capturados da API Receita WS</h3> 
                            <table style="border: 1px solid black; border-collapse: collapse; border-radius: 10px; width: 500px;">
                                <thead>
                                    <th style="background-color: aquamarine; vertical-align: middle;"> Nome </th>
                                    <th style="background-color: aquamarine; vertical-align: middle;"> CNPJ </th>
                                    <th style="background-color: aquamarine; vertical-align: middle;"> CEP </th>
                                </thead>
                                
                                <tbody>
                                    <td style="border: 1px solid black; border-collapse: collapse; border-radius: 10px; height: 50px; vertical-align: middle; text-align: center; background-color: #ddd;"> ${informacaoReceitaFederal.nome} </td>
                                    <td style="border: 1px solid black; border-collapse: collapse; border-radius: 10px; height: 50px; vertical-align: middle; text-align: center; background-color: #ddd;"> ${informacaoReceitaFederal.cnpj} </td>
                                    <td style="border: 1px solid black; border-collapse: collapse; border-radius: 10px; height: 50px; vertical-align: middle; text-align: center; background-color: #ddd;">  ${informacaoReceitaFederal.cep} </td>
                            </table>

                            <table style="border: 1px solid black; border-collapse: collapse; border-radius: 10px; width: 500px;">
                                <thead>
                                    <th style="background-color: aquamarine; vertical-align: middle;"> Endereço </th>
                                </thead>
                                
                                <tbody>
                                    <td style="border: 1px solid black; border-collapse: collapse; border-radius: 10px; height: 50px; vertical-align: middle; text-align: center; background-color: #ddd;">  ${informacaoReceitaFederal.logradouro}, Nº ${informacaoReceitaFederal.numero}, ${informacaoReceitaFederal.bairro}, ${informacaoReceitaFederal.municipio} / ${informacaoReceitaFederal.uf} </td>
                            </table>
                        </div>
                    </div>
                `;

            footerHTML = 
            `
                    <article> 
                        <span><a href='https://contabnet.com.br/blog/lei-do-e-commerce/#:~:text=A%20Lei%20do%20E-commerce%20garante%20aos%20clientes%20o,frete%20de%20devolu%C3%A7%C3%A3o%20do%20item%20para%20a%20loja.' target='_blank'>LEI DO ECOMMERCE.</a></span>
                    </article>

                    <footer style="align-items: center;">
                            <h3>SCORE</h3>
                            <span> INFORMAÇÕES DISPONIVEIS NO SITE: ${ informacaoEncontradasSiteArray != null ? '✅' : '❌' } </span><br>
                            <span> INFORMAÇÕES CADASTRADAS NA RECEITA: ${ informacaoReceitaFederal != null ? '✅' : '❌' } </span><br>
                            <span> CNPJ CORRESPONDENTE: ${ cnpjCorresponde == true ? '✅' : '❌'} </span><br>
                            <span> CIDADE CORRESPONDENTE: ${ cidadeCorresponde == true ? '✅' : '❌' } </span><br>
                            <span> NUMERO CORRESPONDENTE: ${ numeroCorresponde == true ? '✅' : '❌' } </span><br>
                            <span> ESTADO CORRESPONDENTE: ${ estadoCorresponde == true ? '✅' : '❌' } </span><br>`;
            if ( cepNaoEncontrado === true ) { 
                footerHTML += `<span> CEP NÃO ENCONTRADO </span><br><`;
            } else { 
                footerHTML +=`<span> CEP CORRESPONDENTE: ${ cepCorresponde == true ? '✅' : '❌' } </span><br>`;
            }

            if ( dataCriacaoDominioNaoEncontrada === true ) { 
                footerHTML += `<span> DATA CRIAÇÃO DO DOMINIO NÃO ENCONTRADA </span><br>`;
            } else { 
                footerHTML += `<span> DATA CRIAÇÃO DOMINIO: ${ dataCriacaoDominioEncontrada[3] } </span><br>`;
            }

            if ( diferencaDias > baseDiasConfiaveisCriacaoDominio ) { 
                footerHTML += `<span> MAIS DE 5 ANOS DE CRIAÇÃO DO DOMINIO ☑ </span><br>`;

                scoreTotal += 8;
            } else { 
                footerHTML += `<span> MENOS DE 5 ANOS DE CRIAÇÃO DO DOMINIO ‼ </span><br>`;
            }

            footerHTML += ` <span style="background-color: ${ scoreTotal < 50 ? "red" : "green"};"> Resultado : ${ scoreTotal } </span> `;

            if ( informacoesEncontradas == null  ) { 
                footerHTML += `<span> SITE NÃO SEGUE A <a href='https://contabnet.com.br/blog/lei-do-e-commerce/#:~:text=A%20Lei%20do%20E-commerce%20garante%20aos%20clientes%20o,frete%20de%20devolu%C3%A7%C3%A3o%20do%20item%20para%20a%20loja.' target='_blank'>LEI DO ECOMMERCE.</a></span><br>`;
            } 

                footerHTML += `
                    </footer>
                </body>
            </html> 
            `;
        }

        const htmlCompleto = htmlInicial + bodyHTML + footerHTML;

        fs.writeFileSync('./writefile.html', htmlCompleto);

        console.log('File has been written');
    } catch ( err ) {     
        console.log(err.message)
        const htmlInicial = 
        `
            <!DOCTYPE html>
            <html lang="pt-br">
                <head>
                    <meta charset="UTF-8">
                    <meta http-equiv="X-UA-Compatible" content="IE=edge">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Document</title>
                </head>
                <body style="background-color: aliceblue; margin: 100px 100px 0px 100px;">
                    <h1 style="text-align: center; font: Arial 12px solid black;">SABE TUDO</h1>
                    <h2 style="text-align: center;">Site Buscado : ${urlCompleta}</h2>`;

        let bodyHTML = "";
        bodyHTML = 
        `
                <p>Informações relevantes a CNPJ não encontradas.</p>
                <footer style="align-items: center;">
                        <h3>SCORE</h3>
                        <span> INFORMAÇÕES CADASTRADAS NA RECEITA: ❌ </span><br>
                        <span style="background-color: ${ scoreTotal < 50 ? "red" : "green"};"> Resultado : ${ scoreTotal } </span>
                </footer>
            </body>
        </html> 
        `;
        
        const htmlCompleto = htmlInicial + bodyHTML;

        fs.writeFileSync('./writefile.html', htmlCompleto);

        console.log('File has been written');
    } finally {        
        if ( browser ) {            
            await browser.close();        
        }

        if ( browser2 ) {            
            await browser2.close();        
        }

        await open('./writefile.html');

        let saida = 1;
        while( saida != variavelSaida ) {
            saida = await promptSite('Digite 0 para finalizar o processo.');
        }

        process.exit();
    }
})();

    function promptSite( mensagem ) {
        var rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    
        return new Promise(function(resolve, reject) {
            let site = 0;
            var ask = function() {
                rl.question(mensagem, function(answer) {
                    site = answer;
                    if ( site != null ) {
                        resolve(site, reject);
                    } else {
                        ask();
                    }
                });
            };
            ask();
        });
    }

    async function buscarInformacoesAPIReceita( cnpj ) {
        const cnpjSemPontosETracos = cnpj.replace(/[^\d]+/g, "");
        try {
            let response = await fetch(`https://receitaws.com.br/v1/cnpj/${cnpjSemPontosETracos}`, {
                "method": "GET",
                "headers": {
                    "Content-Type": "application/json"
                }
            });

            return await response.json();
        } catch ( error ) {
            throw new Error( 'CNPJ não encontrado.' );
        }
    }

    async function buscarInformacoes ( page, informacaoProcurada ) {    
        let texto = "//*[contains(text(), '" + informacaoProcurada + "')]";
        const r = await page.$x( texto );
        let encontrado = "";
        for ( const eh of r ) {       
            encontrado = await eh.evaluate( n => n.parentNode.outerText );  
        }

        return encontrado;
    }

    async function buscarDataCriacaoDominio ( page, url ) {
        page.setDefaultNavigationTimeout(0);  
        await page.goto(`https://registro.br/tecnologia/ferramentas/whois/?search=${url}`);
        

        let texto = "//*[contains(text(), CRIADO)]";
        const r = await page.$x( texto );
        let encontrado = "";
        for ( const eh of r ) {       
            encontrado = await eh.evaluate( n => n.parentNode.outerText );  
        }

        return encontrado;
    }

    async function compararInformacoes ( args1, args2, args3 ) {
        // jogando a string toda pra minuscula e retirando pontos, traços, barras e virgulas e retirando tambem acentuações como til para facilitar a comparação
        let stringLowerCase = args2.replace(/\.|\-/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, "");
        let string1 = stringLowerCase.replace(/\/|\,/g, ' ').toLowerCase();

        switch (args3) {
            case 'cnpj':
                return args2.includes( args1.cnpj );
            case 'cep':
                console.log( args1.cep.replace(/\.|\-|\//g, ''), string1 );
                return string1.includes( args1.cep.replace(/\.|\-|\//g, '').toLowerCase() );
            case 'cidade':
                let municipioSemAcento = args1.municipio.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
                return string1.includes( municipioSemAcento.toLowerCase() );    
            case 'estado':
                return string1.includes( args1.uf.toLowerCase() );    
            case 'numero':
                return string1.includes( args1.numero.replace(/\.|\-|\//g, '').toLowerCase() );    
            default:
                break;
        }
    }

