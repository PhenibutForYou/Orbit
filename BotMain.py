import json
import os
import asyncio
from aiogram import Bot, Dispatcher
from dotenv import load_dotenv
from aiogram.filters import Command
from aiogram.types import Message
from aiohttp import web

load_dotenv()
Token = os.getenv("BOT_TOKEN")
bot = Bot(Token)

dp = Dispatcher()

SUBSFile = "subs.json"

#Загрузка подписчиков
def load_subs():
        try:
            with open(SUBSFile, "r", encoding="utf-8") as f:
                return set(json.load(f))
        except (FileNotFoundError, json.JSONDecodeError):
            with open(SUBSFile, "w", encoding="utf-8") as f:
                json.dump([], f)
            return set()

#Сохранение подписчиков
def save_subs(subs):
        with open(SUBSFile, "w", encoding="utf-8") as f:
            json.dump(list(subs), f)

#Добавление подписчика
def add_subs(chat_id):
    subs = load_subs()
    subs.add(chat_id)
    save_subs(subs)

#Удаление подписчика
def remove_subs(chat_id):
    subs = load_subs()
    if chat_id in subs:
        subs.remove(chat_id)
        save_subs(subs)
        return True
    return False

#Уведомление для машин
async def notify_car(obj_id,car_name,fuel_level,temperature,speed,car_latitude,
car_longitude,start_latitude,start_longitude,end_latitude,end_longitude,status,date):
    chat_id =  load_subs()
    msg = (
           f"🚙 <b>Автомобиль:</b> <i>{car_name}</i> идентификатор - <i>{obj_id}</i> изменил свой статус с нормального на <b>{status}</b>\n\n"
           f"📊 <b>Характеристики автомобиля:</b> 📊 \n"
           f"• Уровень топлива: <code>{fuel_level}%</code>\n"
           f"• Температура автомобиля: <code>{temperature}°C</code>\n"
           f"• Скорость автомобиля: <code>{speed} км/ч</code>\n"
           f"• Местоположение автомобиля: <code>{car_latitude}, {car_longitude}</code>\n\n"
           f"🗺️ <b>Маршрут:</b> 🗺️ \n"
           f"• Пункт отправления: <code>{start_latitude}, {start_longitude}</code>\n"
           f"• Пункт назначения: <code>{end_latitude}, {end_longitude}</code>\n"
           f"🕛 Время обновления: {date} 🕛"
           )
    for sub in chat_id:
        asyncio.create_task(bot.send_message(chat_id=sub, text=msg, parse_mode="HTML"))

#Уведомление для АЗС
async def notify_gas_station(obj_id,name,latitude,longitude,fuel_level,fuel_type,price,workload,status, date):
    chat_id = load_subs()
    msg = (
            f"⛽ <b>Автомобильная заправочная станция:</b> <i>{name}</i> идентификатор - <i>{obj_id}</i> изменил свой статус с нормального на <b>{status}</b>\n\n"
            f"📊 <b>Характеристики Автомобильной заправочной станции:</b> 📊 \n"
            f"• Местоположение: <code>{latitude}, {longitude}</code>\n"
            f"• Заполненность резервуаров: <code>{fuel_level}%</code>\n"
            f"• Вид топлива: <code>{fuel_type}</code>\n"
            f"• Цена за литр: <code>{price} руб</code>\n"
            f"• Загруженность: <code>{workload}%</code>\n\n"
            f"🕛 Время обновления: {date} 🕛"
          )
    for sub in chat_id:
        asyncio.create_task(bot.send_message(chat_id=sub, text=msg, parse_mode="HTML"))

#Уведомление для склада
async def notify_ware_house(obj_id,name,latitude,longitude,workload,temperature,humidity,quantity_of_truck,status,date):
    chat_id =  load_subs()
    msg = (
            f"📦 <b>Склад:</b> <i>{name}</i> идентификатор - <i>{obj_id}</i> изменил свой статус с нормального на <b>{status}</b>\n\n"
            f"📊 <b>Характеристики склада:</b>  📊\n"
            f"• Местоположение: <code>{latitude}, {longitude}</code>\n"
            f"• Загруженность: <code>{workload}%</code>\n"
            f"• Температура: <code>{temperature}°C</code>\n"
            f"• Влажность: <code>{humidity} г/м³</code>\n"
            f"• Количество грузовиков: <code>{quantity_of_truck}</code>\n\n"
            f"🕛 Время обновления: {date} 🕛"
          )
    for sub in chat_id:
        asyncio.create_task(bot.send_message(chat_id=sub, text=msg, parse_mode="HTML"))

#Уведомление для дрона
async def notify_drone(obj_id, name, drone_latitude, drone_longitude,charge,altitude,propeller_speed_pm,speed, start_latitude,start_longitude,end_latitude,end_longitude,status,date):
    chat_id =  load_subs()
    msg = (
            f"🛰️ <b>Дрон:</b> <i>{name}</i> идентификатор - <i>{obj_id}</i> изменил свой статус с нормального на <b>{status}</b>\n\n"
            f"📊 <b>Характеристики дрона:</b> 📊\n"
            f"• Местоположение: <code>{drone_latitude}, {drone_longitude}</code>\n"
            f"• Заряд: <code>{charge}%</code>\n"
            f"• Высота: <code>{altitude} м</code>\n"
            f"• Количество оборотов в минуту: <code>{propeller_speed_pm}</code>\n"
            f"• Скорость: <code>{speed} км/ч</code>\n\n"
            f"🗺️ <b>Маршрут:</b> 🗺️ \n"
            f"• Пункт отправления:  <code>{start_latitude}, {start_longitude}</code>\n"
            f"• Пункт назначения: <code>{end_latitude}, {end_longitude}</code>\n\n"
            f"🕛 Время обновления: {date} 🕛"
          )
    for sub in chat_id:
        asyncio.create_task(bot.send_message(chat_id=sub, text=msg, parse_mode="HTML"))

#Обработчик машин
async def handle_car(request):
    data = await request.json()
    await notify_car(
        obj_id=data.get("obj_id"),
        car_name=data.get("car_name"),
        fuel_level=data.get("fuel_level"),
        temperature=data.get("temperature"),
        speed=data.get("speed"),
        car_latitude=data.get("car_latitude"),
        car_longitude=data.get("car_longitude"),
        start_latitude=data.get("start_latitude"),
        start_longitude=data.get("start_longitude"),
        end_latitude=data.get("end_latitude"),
        end_longitude=data.get("end_longitude"),
        status=data.get("status"),
        date=data.get("date")
    )
    return web.json_response({"status": "ok"})

#Обработчик АЗС
async def handle_gas_station(request):
    data = await request.json()
    await notify_gas_station(
        obj_id=data.get("obj_id"),
        name=data.get("name"),
        latitude=data.get("latitude"),
        longitude=data.get("longitude"),
        fuel_level=data.get("fuel_level"),
        fuel_type=data.get("fuel_type"),
        price=data.get("price"),
        workload=data.get("workload"),
        status=data.get("status"),
        date=data.get("date")
    )
    return web.json_response({"status": "ok"})

#Обработчик складов
async def handle_warehouse(request):
    data = await request.json()
    await notify_ware_house(
        obj_id=data.get("obj_id"),
        name=data.get("name"),
        latitude=data.get("latitude"),
        longitude=data.get("longitude"),
        workload=data.get("workload"),
        temperature=data.get("temperature"),
        humidity=data.get("humidity"),
        quantity_of_truck=data.get("quantity_of_truck"),
        status=data.get("status"),
        date=data.get("date")
    )
    return web.json_response({"status": "ok"})

#Обработчик дронов
async def handle_drone(request):
    data = await request.json()
    await notify_drone(
        obj_id=data.get("obj_id"),
        name=data.get("name"),
        drone_latitude=data.get("drone_latitude"),
        drone_longitude=data.get("drone_longitude"),
        charge=data.get("charge"),
        altitude=data.get("altitude"),
        propeller_speed_pm=data.get("propeller_speed_pm"),
        speed=data.get("speed"),
        start_latitude=data.get("start_latitude"),
        start_longitude=data.get("start_longitude"),
        end_latitude=data.get("end_latitude"),
        end_longitude=data.get("end_longitude"),
        status=data.get("status"),
        date=data.get("date")
    )
    return web.json_response({"status": "ok"})

#HTTP сервер
async def http_server():
    app = web.Application()
    app.router.add_post('/notify/car', handle_car)
    app.router.add_post('/notify/gas_station', handle_gas_station)
    app.router.add_post('/notify/warehouse', handle_warehouse)
    app.router.add_post('/notify/drone', handle_drone)

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, host='127.0.0.1', port=5001)
    await site.start()

#Команда /start
@dp.message(Command("start"))
async def start(message: Message):
    chat_id = message.chat.id
    add_subs(chat_id)
    await message.answer("Бот запущен! Я буду присылать уведомления о критических и предупреждающих состояниях объектов. Для полной остановки бота отправьте /stop")

#Команда /report - (не рабочая)
@dp.message(Command("report"))
async def report(message: Message):
     await message.answer("Вы открыли пасхалку, теперь у вас есть ачивка - исследователь")

#Команда /stop
@dp.message(Command("stop"))
async def stop(message: Message):
    if remove_subs(message.chat.id):
        await message.answer("Вы отписались от уведомлений. Чтобы снова подписаться, воспользуйтесь командой /start")
    else:
        await message.answer("Вы не были подписаны на уведомления")
        
async def main():
    await http_server()
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())