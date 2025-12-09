package com.jusizanggmail.myapp.utils;


import android.util.Log;
import java.util.ArrayList;
import java.util.List;
import java.lang.reflect.Type;
import java.nio.charset.StandardCharsets;


import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.TypeAdapter;
import com.google.gson.TypeAdapterFactory;
import com.google.gson.reflect.TypeToken;

import com.jusizanggmail.myapp.template.BarCodeElement;
import com.jusizanggmail.myapp.template.Element;
import com.jusizanggmail.myapp.template.GraphElement;
import com.jusizanggmail.myapp.template.ImageElement;
import com.jusizanggmail.myapp.template.LineElement;
import com.jusizanggmail.myapp.template.PrintTemplate;
import com.jusizanggmail.myapp.template.QrCodeElement;
import com.jusizanggmail.myapp.template.TextElement;


public class PrintData {
    private static final String TAG = "PrintData";

    public static List<ArrayList<String>> getPrintData(int copies, String type, float multiple,String data) {
        switch (type) {
            case "qrcode":
                return getQrCodePrintData(copies, multiple,data);
            case "text" :
                return getTextPrintData(copies,multiple);
            case "barcode":
                return getBarCodePrintData(copies,multiple);
            case "line":
                return getLinePrintData(copies,multiple);
            case "graph":
                return getGraphPrintData(copies,multiple);
            case "image":
                return getImagePrintData(copies, multiple,data);
            default:
                return null;
        }
    }


    
    public static List<ArrayList<String>> getGraphPrintData(int copies, float multiple) {
        List<ArrayList<String>> printData = new ArrayList<>();
        ArrayList<String> printJsonData = new ArrayList<>();
        ArrayList<String> printInfoData = new ArrayList<>();


        float offsetX = 0f;
        float offsetY = 0f;
        float width = 40f;
        float height = 20f;
        int rotate = 0;
        float marginX = 2.0f;
        float marginY = 2.0f;
        float lineWidth = 0.5f;

        String data = "{" +
                "\"InitDrawingBoardParam\": {" +
                "\"width\": " + width + "," +
                "\"height\": " + height + "," +
                "\"rotate\": " + rotate + "," +
                "\"path\": \"ZT001.ttf\"," +
                "\"verticalShift\": 0," +
                "\"HorizontalShift\": 0" +
                "}," +
                "\"elements\": [" +
                "{" +
                "\"type\": \"graph\"," +
                "\"json\": {" +
                "\"x\": " + (marginX + offsetX) + "," +
                "\"y\": " + (marginY + offsetY) + "," +
                "\"height\": " + (height - marginX * 2) + "," +
                "\"width\": " + (width - marginX * 2) + "," +
                "\"rotate\": 0," +
                "\"graphType\": 3," +
                "\"cornerRadius\": 0," +
                "\"lineWidth\":" + lineWidth + "," +
                "\"lineType\": 1," +
                "\"dashwidth\": [1, 1] " +
                "}" +
                "}" +

                "]" +
                "}";


        printJsonData.add(getJsonPrintData(data, 1).get(0));
        Log.d(TAG, "getBarCodePrintData: " + getJsonPrintData(data, 1).get(0));
        String infoData = "{\n" +
                "    \"printerImageProcessingInfo\": {\n" +
                "        \"orientation\": " + rotate + ",\n" +
                "        \"margin\": [0, 0, 0, 0],\n" +
                "        \"printQuantity\": " + copies + ",\n" +
                "        \"horizontalOffset\": 0,\n" +
                "        \"verticalOffset\": 0,\n" +
                "        \"width\": " + width + ",\n" +
                "        \"height\": " + height + ",\n" +
                "        \"printMultiple\": \"" + multiple + "\",\n" +
                "        \"epc\": \"\"\n" +
                "    }\n" +
                "}";
        printInfoData.add(infoData);
        printData.add(printJsonData);
        printData.add(printInfoData);
        return printData;
    }

    public static List<ArrayList<String>> getLinePrintData(int copies, float multiple) {
        List<ArrayList<String>> printData = new ArrayList<>();
        ArrayList<String> printJsonData = new ArrayList<>();
        ArrayList<String> printInfoData = new ArrayList<>();


        float offsetX = 0f;
        float offsetY = 0f;
        float width = 40f;
        float height = 20f;
        int rotate = 0;
        float marginX = 2.0f;
        float marginY = 2.0f;
        float lineWidth = 0.5f;

        String data = "{" +
                "\"InitDrawingBoardParam\": {" +
                "\"width\": " + width + "," +
                "\"height\": " + height + "," +
                "\"rotate\": " + rotate + "," +
                "\"path\": \"ZT001.ttf\"," +
                "\"verticalShift\": 0," +
                "\"HorizontalShift\": 0" +
                "}," +
                "\"elements\": [" +
                "{" +
                "\"type\": \"line\"," +
                "\"json\": {" +
                "\"x\": " + (marginX + offsetX) + "," +
                "\"y\": " + (marginY + offsetY) + "," +
                "\"height\": " + lineWidth + "," +
                "\"width\": " + (width - marginX * 2) + "," +
                "\"rotate\": 0," +
                "\"lineType\": 0," +
                "\"dashwidth\": [1, 1] " +
                "}" +
                "}," +
                "{" +
                "\"type\": \"line\"," +
                "\"json\": {" +
                "\"x\": " + (marginX + offsetX) + "," +
                "\"y\": " + (height - marginY + offsetX) + "," +
                "\"height\": " + lineWidth + "," +
                "\"width\": " + (width - marginX * 2) + "," +
                "\"rotate\": 0," +
                "\"lineType\": 0," +
                "\"dashwidth\": [1, 1] " +
                "}" +
                "}," +
                "{" +
                "\"type\": \"line\"," +
                "\"json\": {" +
                "\"x\": " + (marginX + offsetX) + "," +
                "\"y\": " + (marginY + offsetY) + "," +
                "\"height\": " + (height - marginY * 2) + "," +
                "\"width\": " + lineWidth + "," +
                "\"rotate\": 0," +
                "\"lineType\": 0," +
                "\"dashwidth\": [1, 1] " +
                "}" +
                "}," +
                "{" +
                "\"type\": \"line\"," +
                "\"json\": {" +
                "\"x\": " + (width - marginX + offsetX) + "," +
                "\"y\": " + (marginY + offsetY) + "," +
                "\"height\": " + (height - marginY * 2) + "," +
                "\"width\": " + lineWidth + "," +
                "\"rotate\": 0," +
                "\"lineType\": 0," +
                "\"dashwidth\": [1, 1] " +
                "}" +
                "}" +
                "]" +
                "}";


        printJsonData.add(getJsonPrintData(data, 1).get(0));
        Log.d(TAG, "getBarCodePrintData: " + getJsonPrintData(data, 1).get(0));
        String infoData = "{\n" +
                "    \"printerImageProcessingInfo\": {\n" +
                "        \"orientation\": " + rotate + ",\n" +
                "        \"margin\": [0, 0, 0, 0],\n" +
                "        \"printQuantity\": " + copies + ",\n" +
                "        \"horizontalOffset\": 0,\n" +
                "        \"verticalOffset\": 0,\n" +
                "        \"width\": " + width + ",\n" +
                "        \"height\": " + height + ",\n" +
                "        \"printMultiple\": \"" + multiple + "\",\n" +
                "        \"epc\": \"\"\n" +
                "    }\n" +
                "}";
        printInfoData.add(infoData);
        printData.add(printJsonData);
        printData.add(printInfoData);
        return printData;
    }

    public static List<ArrayList<String>> getBarCodePrintData(int copies, float multiple) {
        List<ArrayList<String>> printData = new ArrayList<>();
        ArrayList<String> printJsonData = new ArrayList<>();
        ArrayList<String> printInfoData = new ArrayList<>();


        float offsetX = 0f;
        float offsetY = 0f;
        float width = 40f;
        float height = 20f;
        int rotate = 0;
        float marginX = 2.0f;
        float marginY = 2.0f;
        float barCodeWidth = width - marginX * 2.0f;
        float barCodeHeight = height - marginY * 2.0f;
        float fontSize = 3.2f;

        String data = "{" +
                "\"InitDrawingBoardParam\": {" +
                "\"width\": " + width + "," +
                "\"height\": " + height + "," +
                "\"rotate\": " + rotate + "," +
                "\"path\": \"ZT001.ttf\"," +
                "\"verticalShift\": 0," +
                "\"HorizontalShift\": 0" +
                "}," +
                "\"elements\": [" +
                "{" +
                "\"type\": \"barCode\"," +
                "\"json\": {" +
                "\"x\": " + (marginX + offsetX) + "," +
                "\"y\": " + (marginY + offsetY) + "," +
                "\"height\": " + barCodeHeight + "," +
                "\"width\": " + barCodeWidth + "," +
                "\"value\": \"12345678\"," +
                "\"codeType\": \"20\"," +
                "\"rotate\": 0," +
                "\"fontSize\": " + fontSize + "," +
                "\"textPosition\": 0" +
                "}" +
                "}" +

                "]" +
                "}";


        printJsonData.add(getJsonPrintData(data, 1).get(0));
        String infoData = "{\n" +
                "    \"printerImageProcessingInfo\": {\n" +
                "        \"orientation\": " + rotate + ",\n" +
                "        \"margin\": [0, 0, 0, 0],\n" +
                "        \"printQuantity\": " + copies + ",\n" +
                "        \"horizontalOffset\": 0,\n" +
                "        \"verticalOffset\": 0,\n" +
                "        \"width\": " + width + ",\n" +
                "        \"height\": " + height + ",\n" +
                "        \"printMultiple\": \"" + multiple + "\",\n" +
                "        \"epc\": \"\"\n" +
                "    }\n" +
                "}";
        printInfoData.add(infoData);
        printData.add(printJsonData);
        printData.add(printInfoData);
        return printData;
    }

    public static List<ArrayList<String>> getQrCodePrintData(int copies, float multiple,String value) {
        List<ArrayList<String>> printData = new ArrayList<>();
        ArrayList<String> printJsonData = new ArrayList<>();
        ArrayList<String> printInfoData = new ArrayList<>();

        float offsetX = 0f;
        float offsetY = 0f;
        float width = 30f;
        float height = 30f;
        int rotate = 0;
        float marginX = 2.0f;
        float marginY = 2.0f;
        float qrCodeHeight = width - marginX * 2.0f;
        float qrCodeWidth = qrCodeHeight;

        String data = "{" +
                "\"InitDrawingBoardParam\": {" +
                "\"width\": " + width + "," +
                "\"height\": " + height + "," +
                "\"rotate\": " + rotate + "," +
                "\"path\": \"ZT001.ttf\"," +
                "\"verticalShift\": 0," +
                "\"HorizontalShift\": 0" +
                "}," +
                "\"elements\": [" +
                "{" +
                "\"type\": \"qrCode\"," +
                "\"json\": {" +
                "\"x\": " + (marginX + offsetX) + "," +
                "\"y\": " + (marginY + offsetY) + "," +
                "\"height\": " + qrCodeHeight + "," +
                "\"width\": " + qrCodeWidth + "," +
                "\"value\": " + value + "," +
                "\"codeType\": \"31\"," +
                "\"rotate\": 0" +
                "}" +
                "}" +

                "]" +
                "}";


        printJsonData.add(getJsonPrintData(data, 1).get(0));
        String infoData = "{\n" +
                "    \"printerImageProcessingInfo\": {\n" +
                "        \"orientation\": " + rotate + ",\n" +
                "        \"margin\": [0, 0, 0, 0],\n" +
                "        \"printQuantity\": " + copies + ",\n" +
                "        \"horizontalOffset\": 0,\n" +
                "        \"verticalOffset\": 0,\n" +
                "        \"width\": " + width + ",\n" +
                "        \"height\": " + height + ",\n" +
                "        \"printMultiple\": \"" + multiple + "\",\n" +
                "        \"epc\": \"\"\n" +
                "    }\n" +
                "}";
        printInfoData.add(infoData);
        printData.add(printJsonData);
        printData.add(printInfoData);
        return printData;
    }

    public static List<ArrayList<String>> getImagePrintData(int copies, float multiple, String value) {
        List<ArrayList<String>> printData = new ArrayList<>();
        ArrayList<String> printJsonData = new ArrayList<>();
        ArrayList<String> printInfoData = new ArrayList<>();

        float canvasWidth = 70f;
        float canvasHeight = 40f;

        float offsetX = 0f;
        float offsetY = 0f;
        float width = 70f;
        float height = 40f;
        int rotate = 0;
        String imgData200 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAAAADwCAIAAAChXqV1AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyVpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDYuMC1jMDA1IDc5LjE2NDU5MCwgMjAyMC8xMi8wOS0xMTo1Nzo0NCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIDIyLjEgKE1hY2ludG9zaCkiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6Qjk1MzA5NzlGQzU1MTFFREE3NDlCMzAzMjU0NzAyQzkiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6Qjk1MzA5N0FGQzU1MTFFREE3NDlCMzAzMjU0NzAyQzkiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpCOTUzMDk3N0ZDNTUxMUVEQTc0OUIzMDMyNTQ3MDJDOSIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpCOTUzMDk3OEZDNTUxMUVEQTc0OUIzMDMyNTQ3MDJDOSIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Pvfq4t4AABGVSURBVHja7N1L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";

        // String img = value.substring(22);
        String img = value;


        img = img.replaceAll("[\r\n]+", ""); // 去除换行符

        Log.d(TAG, "getImagePrintData: " + img);
        String data = "{" +
                "\"InitDrawingBoardParam\": {" +
                "\"width\": " + canvasWidth + "," +
                "\"height\": " + canvasHeight + "," +
                "\"rotate\": " + rotate + "," +
                "\"path\": \"ZT001.ttf\"," +
                "\"verticalShift\": 0," +
                "\"HorizontalShift\": 0" +
                "}," +
                "\"elements\": [" +
                "{" +
                "\"type\": \"image\"," +
                "\"json\": {" +
                "\"x\": " + offsetX + "," +
                "\"y\": " + offsetY + "," +
                "\"height\": " + height + "," +
                "\"width\": " + width + "," +
                "\"rotate\": 0," +
                "\"imageData\": \"" + img + "\"," +
                "\"imageProcessingType\": 0," +
                "\"imageProcessingValue\": 127" +

                "}" +
                "}" +

                "]" +
                "}";


        printJsonData.add(getJsonPrintData(data, 1).get(0));
        Log.d(TAG, "getBarCodePrintData: " + getJsonPrintData(data, 1).get(0));
        String infoData = "{\n" +
                "    \"printerImageProcessingInfo\": {\n" +
                "        \"orientation\": " + rotate + ",\n" +
                "        \"margin\": [0, 0, 0, 0],\n" +
                "        \"printQuantity\": " + copies + ",\n" +
                "        \"horizontalOffset\": 0,\n" +
                "        \"verticalOffset\": 0,\n" +
                "        \"width\": " + width + ",\n" +
                "        \"height\": " + height + ",\n" +
                "        \"printMultiple\": \"" + multiple + "\",\n" +
                "        \"epc\": \"\"\n" +
                "    }\n" +
                "}";
        printInfoData.add(infoData);
        printData.add(printJsonData);
        printData.add(printInfoData);
        return printData;
    }

    public static List<ArrayList<String>> getTextPrintData(int copies, float multiple) {
        List<ArrayList<String>> printData = new ArrayList<>();
        ArrayList<String> printJsonData = new ArrayList<>();
        ArrayList<String> printInfoData = new ArrayList<>();


        float offsetX = 0f;
        float offsetY = -2.0f;
        float width = 40f;
        float height = 60f;
        int rotate = 0;
        float marginX = 2.0f;
        float marginY = 2.0f;
        float titleFontSize = 5.6f;
        float titleWidth = width - marginX * 2;
        float titleHeight = 7.4f;
        float sheetHeight = 6.0f;
        float contentWidth = width - marginX * 3;
        float contentHeight = 4.3f;
        float fontSize = 3.2f;

        String data = "{" +
                "\"InitDrawingBoardParam\": {" +
                "\"width\": " + width + "," +
                "\"height\": " + height + "," +
                "\"rotate\": " + rotate + "," +
                "\"path\": \"ZT001.ttf\"," +
                "\"verticalShift\": 0," +
                "\"HorizontalShift\": 0" +
                "}," +
                "\"elements\": [" +
                "{" +
                "\"type\": \"text\"," +
                "\"json\": {" +
                "\"x\": " + (marginX + offsetX) + "," +
                "\"y\": " + (marginY * 2 + offsetY) + "," +
                "\"height\": " + titleHeight + "," +
                "\"width\": " + titleWidth + "," +
                "\"value\": \"合格证\"," +
                "\"fontFamily\": \"宋体\"," +
                "\"rotate\": 0," +
                "\"fontSize\": " + titleFontSize + "," +
                "\"textAlignHorizonral\": 1," +
                "\"textAlignVertical\": 1," +
                "\"letterSpacing\": 0.0," +
                "\"lineSpacing\": 1.0," +
                "\"lineMode\": 6," +
                "\"fontStyle\": [true, false, false, false]" +
                "}" +
                "}," +
                "{" +
                "\"type\": \"text\"," +
                "\"json\": {" +
                "\"x\": " + (marginX * 1.5 + offsetX) + "," +
                "\"y\": " + (marginY * 6.5 + offsetY) + "," +
                "\"height\": " + contentHeight + "," +
                "\"width\": " + contentWidth + "," +
                "\"value\": \"品名：连衣裙\"," +
                "\"fontFamily\": \"宋体\"," +
                "\"rotate\": 0," +
                "\"fontSize\": " + fontSize + "," +
                "\"textAlignHorizonral\": 0," +
                "\"textAlignVertical\": 1," +
                "\"letterSpacing\": 0.0," +
                "\"lineSpacing\": 1.0," +
                "\"lineMode\": 6," +
                "\"fontStyle\": [false, false, false, false]" +
                "}" +
                "}," +
                "{" +
                "\"type\": \"text\"," +
                "\"json\": {" +
                "\"x\": " + (marginX * 1.5 + offsetX) + "," +
                "\"y\": " + (marginY * 6.5 + sheetHeight + offsetY) + "," +
                "\"height\": " + contentHeight + "," +
                "\"width\":" + contentWidth + "," +
                "\"value\": \"货号：L0565\"," +
                "\"fontFamily\": \"宋体\"," +
                "\"rotate\": 0," +
                "\"fontSize\": " + fontSize + "," +
                "\"textAlignHorizonral\": 0," +
                "\"textAlignVertical\": 1," +
                "\"letterSpacing\": 0.0," +
                "\"lineSpacing\": 1.0," +
                "\"lineMode\": 6," +
                "\"fontStyle\": [false, false, false, false]" +
                "}" +
                "}," +
                "{" +
                "\"type\": \"text\"," +
                "\"json\": {" +
                "\"x\": " + (marginX * 1.5 + offsetX) + "," +
                "\"y\": " + (marginY * 6.5 + sheetHeight * 2 + offsetY) + "," +
                "\"height\": " + contentHeight + "," +
                "\"width\":" + contentWidth + "," +
                "\"value\": \"尺码：S（155）\"," +
                "\"fontFamily\": \"宋体\"," +
                "\"rotate\": 0," +
                "\"fontSize\": " + fontSize + "," +
                "\"textAlignHorizonral\": 0," +
                "\"textAlignVertical\": 1," +
                "\"letterSpacing\": 0.0," +
                "\"lineSpacing\": 1.0," +
                "\"lineMode\": 6," +
                "\"fontStyle\": [false, false, false, false]" +
                "}" +
                "}," +
                "{" +
                "\"type\": \"text\"," +
                "\"json\": {" +
                "\"x\": " + (marginX * 1.5 + offsetX) + "," +
                "\"y\": " + (marginY * 6.5 + sheetHeight * 3 + offsetY) + "," +
                "\"height\": " + contentHeight + "," +
                "\"width\":" + contentWidth + "," +
                "\"value\": \"颜色：蓝色\"," +
                "\"fontFamily\": \"宋体\"," +
                "\"rotate\": 0," +
                "\"fontSize\": " + fontSize + "," +
                "\"textAlignHorizonral\": 0," +
                "\"textAlignVertical\": 1," +
                "\"letterSpacing\": 0.0," +
                "\"lineSpacing\": 1.0," +
                "\"lineMode\": 6," +
                "\"fontStyle\": [false, false, false, false]" +
                "}" +
                "}," +
                "{" +
                "\"type\": \"text\"," +
                "\"json\": {" +
                "\"x\": " + (marginX * 1.5 + offsetX) + "," +
                "\"y\": " + (marginY * 6.5 + sheetHeight * 4 + offsetY) + "," +
                "\"height\": " + contentHeight + "," +
                "\"width\":" + contentWidth + "," +
                "\"value\": \"面料：100%聚酯纤维\"," +
                "\"fontFamily\": \"宋体\"," +
                "\"rotate\": 0," +
                "\"fontSize\": " + fontSize + "," +
                "\"textAlignHorizonral\": 0," +
                "\"textAlignVertical\": 1," +
                "\"letterSpacing\": 0.0," +
                "\"lineSpacing\": 1.0," +
                "\"lineMode\": 6," +
                "\"fontStyle\": [false, false, false, false]" +
                "}" +
                "}," +
                "{" +
                "\"type\": \"text\"," +
                "\"json\": {" +
                "\"x\": " + (marginX * 1.5 + offsetX) + "," +
                "\"y\": " + (marginY * 6.5 + sheetHeight * 5 + offsetY) + "," +
                "\"height\": " + titleHeight * 2 + "," +
                "\"width\":" + contentWidth + "," +
                "\"value\": \"全国统一价\\n¥188\"," +
                "\"fontFamily\": \"宋体\"," +
                "\"rotate\": 0," +
                "\"fontSize\": " + titleFontSize + "," +
                "\"textAlignHorizonral\": 1," +
                "\"textAlignVertical\": 1," +
                "\"letterSpacing\": 0.0," +
                "\"lineSpacing\": 1.0," +
                "\"lineMode\": 6," +
                "\"fontStyle\": [false, false, false, false]" +
                "}" +
                "}" +
                "]" +
                "}";  // Properly close root object


        printJsonData.add(getJsonPrintData(data, 1).get(0));

        String infoData = "{\n" +
                "    \"printerImageProcessingInfo\": {\n" +
                "        \"orientation\": " + rotate + ",\n" +
                "        \"margin\": [0, 0, 0, 0],\n" +
                "        \"printQuantity\": " + copies + ",\n" +
                "        \"horizontalOffset\": 0,\n" +
                "        \"verticalOffset\": 0,\n" +
                "        \"width\": " + width + ",\n" +
                "        \"height\": " + height + ",\n" +
                "        \"printMultiple\": \"" + multiple + "\",\n" +
                "        \"epc\": \"\"\n" +
                "    }\n" +
                "}";
        printInfoData.add(infoData);
        printData.add(printJsonData);
        printData.add(printInfoData);
        return printData;
    }

    //使用JSON绘制，生成最终打印数据函数
    public static List<String> getJsonPrintData(String data, int dataType) {
        Gson gson = new GsonBuilder()
                .registerTypeAdapter(Element.class, new ElementAdapter(new Gson()))
                .registerTypeAdapterFactory(new TypeAdapterFactory() {
                    @Override
                    public <T> TypeAdapter<T> create(Gson gson, TypeToken<T> type) {
                        if (type.getRawType().equals(Element.class)) {
                            return (TypeAdapter<T>) new ElementAdapter(gson);
                        }
                        return null;
                    }
                })
                .create();
        Log.d(TAG, "getJsonPrintData2");

        List<String> printDataList = new ArrayList<>();
        try {
            if (dataType == 1) {
                PrintTemplate template = gson.fromJson(data, PrintTemplate.class);
                Log.d(TAG, "getJsonPrintData3");

                printDataList.add(processPrintTemplate(template));
            } else {
                Type templateType = new TypeToken<List<PrintTemplate>>() {
                }.getType();
                List<PrintTemplate> printTemplateList = gson.fromJson(data, templateType);
                for (PrintTemplate template : printTemplateList) {
                    printDataList.add(processPrintTemplate(template));
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Gson parsing error:", e);
        }
        return printDataList;


    }

    private static String processPrintTemplate(PrintTemplate template) {
        List<String> fonts = new ArrayList<>();
        PrintUtil.getInstance().drawEmptyLabel(
                template.getInitDrawingBoardParam().getWidth(),
                template.getInitDrawingBoardParam().getHeight(),
                template.getInitDrawingBoardParam().getRotate(),
                fonts);

        List<Element> elements = template.getElements();
        for (Element element : elements) {
            if (element instanceof TextElement textElement) {
                TextElement.TextJson json = textElement.getJson();
                Log.d(TAG, "getJsonPrintData-getTextAlignHorizontal:" + json.getTextAlignHorizontal());
                PrintUtil.getInstance().drawLabelText(
                        json.getX(), json.getY(),
                        json.getWidth(), json.getHeight(),
                        json.getValue(), json.getFontFamily(),
                        json.getFontSize(), json.getRotate(),
                        json.getTextAlignHorizontal(),
                        json.getTextAlignVertical(),
                        json.getLineMode(),
                        json.getLetterSpacing(),
                        json.getLineSpacing(),
                        json.getFontStyle());

            } else if (element instanceof BarCodeElement barCodeElement) {
                BarCodeElement.BarCodeJson json = barCodeElement.getJson();
                PrintUtil.getInstance().drawLabelBarCode(
                        json.getX(), json.getY(),
                        json.getWidth(), json.getHeight(),
                        json.getCodeType(), json.getValue(),
                        json.getFontSize(), json.getRotate(),
                        json.getTextHeight(), json.getTextPosition());

            } else if (element instanceof LineElement lineElement) {
                LineElement.LineJson json = lineElement.getJson();
                PrintUtil.getInstance().drawLabelLine(
                        json.getX(), json.getY(),
                        json.getWidth(), json.getHeight(),
                        json.getLineType(), json.getRotate(),
                        json.getDashwidth());

            } else if (element instanceof GraphElement graphElement) {
                GraphElement.GraphJson json = graphElement.getJson();
                PrintUtil.getInstance().drawLabelGraph(
                        json.getX(), json.getY(),
                        json.getWidth(), json.getHeight(),
                        json.getGraphType(), json.getRotate(),
                        json.getCornerRadius(), json.getLineWidth(),
                        json.getLineType(), json.getDashWidth());

            } else if (element instanceof QrCodeElement qrCodeElement) {
                QrCodeElement.QrCodeJson json = qrCodeElement.getJson();
                PrintUtil.getInstance().drawLabelQrCode(
                        json.getX(), json.getY(),
                        json.getWidth(), json.getHeight(),
                        json.getValue(), json.getCodeType(),
                        json.getRotate());

            } else if (element instanceof ImageElement imageElement) {
                ImageElement.ImageJson json = imageElement.getJson();
                PrintUtil.getInstance().drawLabelImage(
                        json.getImageData(),
                        json.getX(), json.getY(),
                        json.getWidth(), json.getHeight(),
                        json.getRotate(), json.getImageProcessingType(), json.getImageProcessingValue());
            }
        }

        byte[] printData = PrintUtil.getInstance().generateLabelJson();
        return new String(printData, StandardCharsets.UTF_8);
    }
  


}
