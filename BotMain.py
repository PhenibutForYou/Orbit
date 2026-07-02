import json
import os
import asyncio

from aiogram import Bot, Dispatcher
from dotenv import load_dotenv
from aiogram.filters import Command
from aiogram.types import Message

load_dotenv()
Token = os.getenv("BOT_TOKEN")
bot = Bot(Token)

dp = Dispatcher()

SUBSF = "subs.json"

def LoadSubs():
    if os.path.exists(SUBSF):
        with open(SUBSF, "r") as f:
            return set(json.load(f))
    return set()

def SaveSubs(subs):
    with open(SUBSF, "w") as f:
        json.dump(list(subs), f)

def AddSubs(chatid):
    subs = LoadSubs()
    subs.add(chatid)
    SaveSubs(subs)

def RemoveSubs(chatid):
    subs = LoadSubs()
    if chatid in subs:
        subs.remove(chatid)
        SaveSubs(subs)
        return True
    return False

#Уведомление для машин
async def NotifyCar(id,car_name,fuel_level,temperature,speed,car_latitude,
car_longitude,start_latitude,start_longitude,end_latitude,end_longitude,status,date):
    chatid = LoadSubs()
    msg = (
           f"Автомобиль: {car_name} идентификатор - {id} изменил свой статус с нормального\n"
           f"Характеристики автомобиля: \n"
           f"Уровень топлива: {fuel_level}\n"
           f"Температура автомобиля: {temperature}\n"
           f"Скорость автомобиля: {speed}\n"
           f"Местоположение автомобиля: {car_latitude}, {car_longitude}\n"
           f"Пункт отправления: {start_latitude}, {start_longitude}\n"
           f"Пункт назначения: {end_latitude}, {end_longitude}\n"
           f"Статус: {status}\n"
           f"Время обновления: {date}"
           )
    for sub in chatid:
        await bot.send_message(chat_id=sub, text=msg)

#Уведомление для АЗС
async def NotifyGasStation(id,name,latitude,longitude,fuel_level,fuel_type,price,workload,status, date):
    chatid = LoadSubs()
    msg = (
            f"Автомобильная заправочная станция: {name} идентификатор - {id} изменил свой статус с нормального\n"
            f"Характеристики Автомобильной заправочной станции: \n"
            f"Местоположение: {latitude}, {longitude}\n"
            f"Заполненность резервуаров: {fuel_level}\n"
            f"Вид топлива: {fuel_type}\n"
            f"Цена за литр: {price}\n"
            f"Загруженность: {workload}\n"
            f"Статус: {status}\n"
            f"Время обновления: {date}"
          )
    for sub in chatid:
        await bot.send_message(chat_id=sub, text=msg)

#Уведомление для склада
async def NotifyWareHouse(id,name,latitude,longitude,workload,temperature,humidity,quantityoftruck,status,date):
    chatid = LoadSubs()
    msg = (
            f"Склад: {name} идентификатор - {id} изменил свой статус с нормального\n"
            f"Характеристики склада:\n"
            f"Местоположение: {latitude}, {longitude}\n"
            f"Загруженность: {workload}\n"
            f"Температура: {temperature}\n"
            f"Влажность: {humidity}\n"
            f"Количество грузовиков: {quantityoftruck}\n"
            f"Статус: {status}\n"
            f"Время обновления: {date}"
          )
    for sub in chatid:
        await bot.send_message(chat_id=sub, text=msg)


#Уведомление для дрона
async def NotifyDron(id, name, dron_latitude, dron_longitude,charge,altitude,propeller_speed_pm,speed, start_latitude,start_longitude,end_latitude,end_longitude,status,date):
    chatid = LoadSubs()
    msg = (
            f"Дрон: {name} идентификатор - {id} изменил свой статус с нормального\n"
            f"Характеристики дрона:\n"
            f"Местоположение: {dron_latitude}, {dron_longitude}\n"
            f"Заряд: {charge}\n"
            f"Высота: {altitude}\n"
            f"Количество оборотов в минуту: {propeller_speed_pm}\n"
            f"Скорость: {speed}\n"
            f"Пункт отправления:  {start_latitude}, {start_longitude}\n"
            f"Пункт назначения: {end_latitude}, {end_longitude}\n"
            f"Статус: {status}\n"
            f"Время обновления: {date}"
          )
    for sub in chatid:
        await bot.send_message(chat_id=sub, text=msg)

@dp.message(Command("start"))
async def start(message: Message):
    chatid = message.chat.id
    AddSubs(chatid)
    await message.answer("Бот запущен! Я буду присылать уведомления о критических и предупреждающих состояниях объектов. Для полной остановки бота отправьте /stop")

@dp.message(Command("report"))
async def report(message: Message):
    await message.answer("Вы открыли пасхалку, теперь у вас есть ачивка - исследователь")

@dp.message(Command("stop"))
async def stop(message: Message):
    if RemoveSubs(message.chat.id):
        await message.answer("Вы отписались от уведомлений. Чтобы снова подписаться, воспользуйтесь командой /start")
    else:
        await message.answer("Вы не были подписаны на уведомления")
        
async def main():
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())