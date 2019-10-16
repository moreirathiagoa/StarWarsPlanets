import {
    FETCH_PLANETS_BEGIN,
    FETCH_PLANET_SUCCESS,
    FETCH_PLANETS_FAILURE,
    FETCH_MULTIPLE_PLANETS_SUCCESS,
    FETCH_FILMS,
    RETRIEVE_PLANET_FROM_CACHE
}            from './types'
import fetch from 'cross-fetch'
import axios from 'axios'

var _ = require('lodash')

/**
 * Arquivo centralizador das Ações do sistema
 * @author Michael Azevedo <michaelfernandes@id.uff.br>
 */


const API_ADDRESS_PLANETS = 'https://swapi.co/api/planets/'
const API_ADDRESS_FILMS   = 'https://swapi.co/api/films/'

let filmList = []

/**
 * Função chamada para realizar o fech inicial de dados de filmes e planetas
 * dispara função @see {fetchPlanetsBegin} 
 * dispara função @see {getFilms} 
 * dispara função @see {getInitialPlanets} 
 * @param {Object} planet planeta que será enviado ao reducer de planeta atual
 * @throws {Error} no caso de falha
 */
export function getInitialData(){
  return dispatch => {   
      dispatch(fetchPlanetsBegin())
      dispatch(getFilms())
      .then(() => {
        dispatch(getInitialPlanets())
      })
      .catch(error => {
        console.log('ERRO', error)
        dispatch(fetchPlanetsFailure(error))
      })
  }
}

/**
 * Função chamada para buscar os planetas iniciais na API
 * a mesma verifica se o planeta encontra-se em cache, caso sim,
 * dispara a função que retorna do cache, caso contrário dispara
 * a função que chama a API
 */
export function getInitialPlanets(){
  return dispatch => {    
      dispatch(updateFilmListFromStore()) 
      return apiCall(API_ADDRESS_PLANETS)
        .then(json => {
          dispatch(fetchMultiplePlanetsSuccess(json))
        })
        .catch(error => {
          throw error
        })
  }
}

/**
 * Função chamada para retornar um planeta como o planeta ativo
 * a mesma verifica se o planeta encontra-se em cache, caso sim,
 * dispara a função que retorna do cache, caso contrário dispara
 * a função que chama a API
 * @param {String} id id do planeta que irá compor a url ex: https://swapi.co/api/planets/3
 */
export function verifyCache(id){
  return (dispatch, getState) => {
    const planetsInCache = getState().planets.planetCache
    const searchResult = _.find(planetsInCache, {url: API_ADDRESS_PLANETS + id + '/'})

    if(searchResult){
      dispatch(getPlanetFromCache(searchResult))
    }
    else{
      dispatch(getOnePlanet(id))
    }
  }
}

/**
 * Função que realiza a chamada para API re retorna UM planeta
 * dispara função @see {updateFilmListFromStore} 
 * dispara função @see {fetchPlanetsBegin} 
 * dispara a ação que irá informar ao reducer de planetas o novo planeta 
 * @param {String} id id do planeta que irá compor a url ex: https://swapi.co/api/planets/3
 */
function getOnePlanet(id){
    return dispatch => {
        dispatch(updateFilmListFromStore())
        dispatch(fetchPlanetsBegin())
        return apiCall(API_ADDRESS_PLANETS + id)
          .then(json => {
            dispatch(fetchPlanetSuccess(json))
          })
          .catch(error => {
            console.log('ERRO', error)
            dispatch(fetchPlanetsFailure(error))
          })
    }
}

/**
 * Função que retorna o planeta encontrado na lista de planetas do cache
 * dispara função @see {fetchPlanetsBegin} 
 * dispara função @see {retrievePlanetFromCache} 
 * @param {Object} planet planeta que será enviado ao reducer de planeta atual
 */
function getPlanetFromCache(planet){
  return dispatch => {
      dispatch(fetchPlanetsBegin())
      dispatch(retrievePlanetFromCache(planet))
  }
}

/**
 * Função que chama a API para retorno da lista de filmes.
 * chamado no inicio do sistema para alimentar a Store de filmes
 * dispara função @see {apiCall} 
 * @throws {Error} no caso de falha
 */
export function getFilms(){
  return dispatch => {    
      return apiCall(API_ADDRESS_FILMS)
        .then(json => {
          dispatch(fetchAllFilms(json.results))
        })
        .catch(error => {
          console.error(error)
          throw error
        })
  }
}

/**
 * Realiza a chamada da API
 * @param {string} address endereço da chamada de API
 */
function apiCall(address) {
  return axios.get(address)
    .then(function (res) {
      return res.data
    })
    .catch(function (error){
      throw error
    })
}

/**
 * Dado uma URL de filme retorna o Título do mesmo na Store.
 * @param {String} filmUrl URL de chamada do filme (Utilizado como ID único)
 * @Return {String} Título do filme
 */
function findFilmInStore(filmUrl){
    let obj =  _.find(filmList, {url: filmUrl})
    
    if (obj){
      return obj.title
    }
    else{
      return 'Not found title'
    }
}

/**
 * Atualiza o array de filmes contido em um planeta para os Nomes de cada filme
 * no lugar de suas URL's
 * @param {Object} planet Planeta contendo a lista de filmes
 * @Return {Object} Planeta com array de filmes contendo os títulos
 */
function loadMovieListFromStore(planet){
  const films = planet.films.map( elt => findFilmInStore(elt))
  return Object.assign(planet, {films: films})
}

/**
 * Atualiza o array de filmes contido em um array de planeta para os Nomes de cada filme
 * no lugar de suas URL's
 * @param {Array} planets Lista de Planetas
 * @Return {Array} Lista de Planetas com array de filmes contendo os títulos
 */
function loadMovieListFromStoreMass(planets){
  const planetList = planets.results.map( elt => loadMovieListFromStore(elt))
  return Object.assign(planets, {results: planetList})
}

/**
 * Salva a lista de filmes da store para adição do
 * nome dos mesmos após as chamadas aos planetas
 */
function updateFilmListFromStore() {
  return (dispatch, getState) => {
    filmList = getState().films
  }
}

/**
 * Action creator para FETCH_FILMS
 * @param {Array} films Array de filmes
 */
export const fetchAllFilms = films => ({
  type: FETCH_FILMS,
  payload: {films}
})

/**
 * Action creator para FETCH_PLANETS_BEGIN
 */
export const fetchPlanetsBegin = () => ({
    type: FETCH_PLANETS_BEGIN
})

/**
 * Action creator para RETRIEVE_PLANET_FROM_CACHE
 * @param {Object} planet Planeta a ser retomado
 */
export const retrievePlanetFromCache = planet => ({
  type: RETRIEVE_PLANET_FROM_CACHE,
  payload: planet
})

/**
 * Action creator para FETCH_PLANET_SUCCESS
 * chama a função interna que substitui as URL's dos filmes pelos nomes
 * @param {Object} planet Planeta a ser salvo
 */
export const fetchPlanetSuccess = planet => ({
    type: FETCH_PLANET_SUCCESS,
    payload: loadMovieListFromStore(planet)
})

/**
 * Action creator para FETCH_MULTIPLE_PLANETS_SUCCESS
 * chama a função interna que substitui as URL's dos filmes pelos nomes
 * @param {Object} planetsData Planeta a ser salvo
 */
export const fetchMultiplePlanetsSuccess = planetsData => ({
  type: FETCH_MULTIPLE_PLANETS_SUCCESS,
  payload: loadMovieListFromStoreMass(planetsData)
})

/**
 * Action creator para FETCH_PLANETS_FAILURE
 * @param {Object} error Erro ao tentar salvar ou retomar os planetas e filmes
 */
export const fetchPlanetsFailure = error => ({
    type: FETCH_PLANETS_FAILURE,
    payload: error 
})