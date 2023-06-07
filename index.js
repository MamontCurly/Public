const mamont = {
    queryToStr(obj) {
      return Object.entries(obj)
      .map(([key, val]) => `${encodeURIComponent(key)}=${encodeURIComponent(val)}`)
      .join('&');
    },
    parseRange(rangeStr) {
      const [start, end] = rangeStr.split('-').map(Number);
      const rangeArray = [];
    
      if (!rangeArray.includes('-')) {
        return [start];
      }
    
      for (let i = start; i <= end; i++) {
        rangeArray.push(i);
      }
    
      return rangeArray;
    } ,
    schedule(time, foo){
      setInterval(()=>{
        const date = new Date()
        const min = date.getMinutes()
        if(this.parseRange(time).includes(min))
        foo()
      }, 1000 * 60)
    },
    async valid_frem(iframe){
    const res = await fetch(iframe.replace('index','api')).then(res=>res.text())
    return res.includes('Попробуйте очистить кеш и повтoрить запрос')
    },
    space(number){
      return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    }
    }

class Slaves{

    constructor(iframe, stat = true){ this.adapter_contructor(iframe, stat) }
    
    async adapter_contructor(iframe, stat){
    this.iframe = iframe
    this.rhash = await this.give_rhash()
    if(stat)
    mamont.schedule('0-5', async ()=>{
      this.rhash = await this.give_rhash()
    })
    }
    
    wait_rhash() {
      return new Promise((resolve, rejected) => {
        if(this.rhash) {
          resolve(this.rhash);
        } else {
          setTimeout(() => {
            this.wait_rhash().then(resolve).catch(rejected);
          }, 100);
        }
      });
    }
    async post(method,parametrs){
    return await fetch(this.iframe.replace('index','api'), {
      "headers": {
      "accept": "*/*",
      "accept-language": "ru,ru-RU;q=0.9,en-US;q=0.8,en;q=0.7",
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "sec-ch-ua": "\"Google Chrome\";v=\"111\", \"Not(A:Brand\";v=\"8\", \"Chromium\";v=\"111\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"", 
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-requested-with": "XMLHttpRequest"
      },
    "referrer": "https://vk.com/",
    "referrerPolicy": "strict-origin-when-cross-origin",
    "body": `${mamont.queryToStr(parametrs)}&method=${method}&rhash=${this.rhash.response}`,
    "method": "POST",
    "mode": "cors",
    "credentials": "omit"
    })
    .then(res=>res.json())
    }
    
    async profile(id){
    const first = await this.post('getMarket.v3',{
      friends : id
    })
    
    if( typeof first.length != 'number' )
    throw JSON.stringify(first,null,2)
    
    const [{hash}] = first, vkid = first[0]['id']
    const second = await this.post('profile',{ vkid, hash})
    
    return second
    }
    
    async give_rhash(){
    try {
      return new Promise(async (resolve,rej)=>{
    let l_hash = await fetch(this.iframe)
    .then(res => res.text())
    .then(res => {
    let ndp = new JSDOM(res)
    let nDoc = ndp.window.document.querySelector("head > script:nth-child(11)").text.toString() 
    const data = nDoc.match(/[a-f0-9]{32}/g)
    return data
    });
    let finish
    for(let its_lhash of l_hash){
    await fetch(this.iframe.replace('index','api'), {
      "headers": { "content-type": "application/x-www-form-urlencoded; charset=UTF-8", "x-requested-with": "XMLHttpRequest" },
      "body": `notify=false&lhash=${its_lhash}&im_slave=391808834&system=true&method=info`,
      "method": "POST",
      })
      .then(res => res.json())
      .then(async res => {
        if(typeof res.res == 'string') this.give_rhash().then(resolve).catch(rej)  
        else resolve({connect : true, response : res.res.hash})
      });
    }
  })
    } catch (Exception) {
    console.log("Неизвестная ошибка " + Exception);
    }
    }
  
    async info(){
      const info = await this.post('info', { })
      return info
    }

    async slaves_data(victims, data){
        victims = Array.isArray(victims) ? victims : [victims]
        if(typeof data !== 'object') throw "Второй аргумент обязан быть обьектом"
        data.cost = data.cost || 1e100
        data.salar = data.salar || 0
        if( !Object.values(data).every(Number.isInteger) ) throw "Параметры во втором аргументе должны быть цифрами"
        const victims_data = await this.post('getMarket.v3',{
            friends : victims
        })

        const profiles = await Promise.all(victims_data.map(async ({ id : vkid, hash}) => await this.post('profile', { vkid, hash })))
        const slaves = profiles.flatMap(profile => profile.res.slaves).filter(slave=> slave.salary > data.salar)
        const slaves_ids = slaves.map(({ vkid }) => vkid)
        const marketData = await this.post('getMarket.v3',{
            friends : slaves_ids
        })

        marketData.forEach(item => {
            const foundData = slaves.find(data => data.vkid == item.id);
            if (foundData) {
              item.vkid = item.id;
              delete item.id;
              item.name = foundData.name
              item.salar = +foundData.salary;
            }
          })

        const response = marketData.filter(({ cost }) => cost < data.cost)
        return response
    }
    async buy(data){
        if(typeof data !== 'object') throw "Аргумент должен быть обьектом"
        if(typeof data.vkid !== 'number') throw "vkid должен быть типа number"
        data.hash = data.hash || await this.post('getMarket.v3',{ friends : data.vkid }).then(res => res[0]['hash'])
        const { vkid, hash } = data
        return await this.post('bu%D1%83', { vkid, hash })
    }
    async profiles(friends){
        const market = await this.post('getMarket.v3',{ friends })
        const profiles = await Promise.all(market.map(async ({ vkid = id, hash }) => await this.post('profile',{ vkid, hash })))
        return profiles
    }
}

const MAMONTRETURN = {Slaves, mamont}
