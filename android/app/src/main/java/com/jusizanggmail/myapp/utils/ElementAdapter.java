package com.jusizanggmail.myapp.utils;


import com.google.gson.*;
import com.google.gson.reflect.TypeToken;
import com.jusizanggmail.myapp.template.*;
import com.google.gson.stream.JsonReader;
import java.io.IOException;

public class ElementAdapter extends TypeAdapter<Element> {
    private final Gson gson;

    public ElementAdapter(Gson gson) {
        this.gson = gson;
    }

    @Override
    public void write(com.google.gson.stream.JsonWriter out, Element value) throws IOException {
        gson.getAdapter(Object.class).write(out, value);
    }

    @Override
    public Element read(JsonReader reader) throws IOException {
        JsonElement jsonElement = new JsonParser().parse(reader);
        JsonObject jsonObject = jsonElement.getAsJsonObject();
        
        JsonElement typeElement = jsonObject.get("type");
        if (typeElement == null) {
            throw new JsonParseException("Missing type field");
        }
        
        String typeValue = typeElement.getAsString();
        Class<? extends Element> elementClass = switch (typeValue) {
            case "text" -> TextElement.class;
            case "barCode" -> BarCodeElement.class;
            case "line" -> LineElement.class;
            case "graph" -> GraphElement.class;
            case "qrCode" -> QrCodeElement.class;
            case "image" -> ImageElement.class;
            default -> throw new JsonParseException("Unknown type: " + typeValue);
        };
        
        return gson.fromJson(jsonObject, elementClass);
    }
}