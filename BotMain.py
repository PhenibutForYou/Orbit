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

SUBSFile = "subs.json"
LOCKFile = asyncio.Lock()

#Загрузка подписчиков
async def load_subs():
    async with LOCKFile:
        try:
            with open(SUBSFile, "r", encoding="utf-8") as f:
                return set(json.load(f))
        except (FileNotFoundError, json.JSONDecodeError):
            with open(SUBSFile, "w", encoding="utf-8") as f:
                json.dump([], f)
            return set()

#Сохранение подписчиков
async def save_subs(subs):
    async with LOCKFile:
        with open(SUBSFile, "w", encoding="utf-8") as f:
            json.dump(list(subs), f)

#Добавление подписчика
async def add_subs(chat_id):
    subs = await load_subs()
    subs.add(chat_id)
    await save_subs(subs)

#Удаление подписчика
async def remove_subs(chat_id):
    subs = await load_subs()
    if chat_id in subs:
        subs.remove(chat_id)
        await save_subs(subs)
        return True
    return False

#Уведомление для машин
async def notify_car(obj_id,car_name,fuel_level,temperature,speed,car_latitude,
car_longitude,start_latitude,start_longitude,end_latitude,end_longitude,status,date):
    chat_id = await load_subs()
    msg = (
           f"Автомобиль: {car_name} идентификатор - {obj_id} изменил свой статус с нормального\n"
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
    for sub in chat_id:
        await bot.send_message(chat_id=sub, text=msg)

#Уведомление для АЗС
async def notify_gas_station(obj_id,name,latitude,longitude,fuel_level,fuel_type,price,workload,status, date):
    chat_id = await load_subs()
    msg = (
            f"Автомобильная заправочная станция: {name} идентификатор - {obj_id} изменил свой статус с нормального\n"
            f"Характеристики Автомобильной заправочной станции: \n"
            f"Местоположение: {latitude}, {longitude}\n"
            f"Заполненность резервуаров: {fuel_level}\n"
            f"Вид топлива: {fuel_type}\n"
            f"Цена за литр: {price}\n"
            f"Загруженность: {workload}\n"
            f"Статус: {status}\n"
            f"Время обновления: {date}"
          )
    for sub in chat_id:
        await bot.send_message(chat_id=sub, text=msg)

#Уведомление для склада
async def notify_ware_house(obj_id,name,latitude,longitude,workload,temperature,humidity,quantity_of_truck,status,date):
    chat_id = await load_subs()
    msg = (
            f"Склад: {name} идентификатор - {obj_id} изменил свой статус с нормального\n"
            f"Характеристики склада:\n"
            f"Местоположение: {latitude}, {longitude}\n"
            f"Загруженность: {workload}\n"
            f"Температура: {temperature}\n"
            f"Влажность: {humidity}\n"
            f"Количество грузовиков: {quantity_of_truck}\n"
            f"Статус: {status}\n"
            f"Время обновления: {date}"
          )
    for sub in chat_id:
        await bot.send_message(chat_id=sub, text=msg)


#Уведомление для дрона
async def notify_drone(obj_id, name, drone_latitude, drone_longitude,charge,altitude,propeller_speed_pm,speed, start_latitude,start_longitude,end_latitude,end_longitude,status,date):
    chat_id = await load_subs()
    msg = (
            f"Дрон: {name} идентификатор - {obj_id} изменил свой статус с нормального\n"
            f"Характеристики дрона:\n"
            f"Местоположение: {drone_latitude}, {drone_longitude}\n"
            f"Заряд: {charge}\n"
            f"Высота: {altitude}\n"
            f"Количество оборотов в минуту: {propeller_speed_pm}\n"
            f"Скорость: {speed}\n"
            f"Пункт отправления:  {start_latitude}, {start_longitude}\n"
            f"Пункт назначения: {end_latitude}, {end_longitude}\n"
            f"Статус: {status}\n"
            f"Время обновления: {date}"
          )
    for sub in chat_id:
        await bot.send_message(chat_id=sub, text=msg)

#Команда /start
@dp.message(Command("start"))
async def start(message: Message):
    chat_id = message.chat.id
    await add_subs(chat_id)
    await message.answer("Бот запущен! Я буду присылать уведомления о критических и предупреждающих состояниях объектов. Для полной остановки бота отправьте /stop")

#Команда /report - (не рабочая)
@dp.message(Command("report"))
async def report(message: Message):
    await message.answer("Вы открыли пасхалку, теперь у вас есть ачивка - исследователь")

#Команда /stop
@dp.message(Command("stop"))
async def stop(message: Message):
    if await remove_subs(message.chat.id):
        await message.answer("Вы отписались от уведомлений. Чтобы снова подписаться, воспользуйтесь командой /start")
    else:
        await message.answer("Вы не были подписаны на уведомления")
        
async def main():
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())