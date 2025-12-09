import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import * as PX from "@/app/pages/config";

import { getStorageRule } from "@/app/api/common";

interface StorageLocationPickerProps {
  value: string;
  editable?: boolean;
  onValueChange: (value: string) => void;
  placeholder?: string;
  style?: any;
  pickerTextStyle?: any;
}

interface StorageOption {
  label: string;
  value: string;
  max: number;
  min: number;
}

const StorageLocationPicker: React.FC<StorageLocationPickerProps> = ({
  value,
  editable = true,
  onValueChange,
  placeholder = "选择库位",
  style,
  pickerTextStyle,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [prefixOptions, setPrefixOptions] = useState<StorageOption[]>([]);
  const [storageOptions, setStorageOptions] = useState<StorageOption[]>([]);
  const [selectedPrefix, setSelectedPrefix] = useState("");
  const [selectedStorage, setSelectedStorage] = useState("");

  // 获取库位数据 - 使用模拟数据，后续可替换为真实API
  const fetchStorageData = async () => {
    try {
      const storages = await getStorageRule({
        preFix: "",
        pageNumber: 1,
        pageSize: 1000,
      });

      if (storages.code == 200) {
        const prefixOptions = storages.data.map((item: any) => ({
          label: item.prefix,
          value: item.prefix,
          min: item.minValue,
          max: item.maxValue,
        }));
        setPrefixOptions(prefixOptions);

        // if(value){
        //     const prefix = value.split("-")[0];
        // }
      }
    } catch (error) {
      console.error("获取库位数据失败:", error);
      Alert.alert("错误", "获取库位数据失败");
    }
  };

  // 处理前缀选择
  const handlePrefixChange = (item: StorageOption) => {
    setSelectedPrefix(item.value);
    setSelectedStorage(""); // 重置库位选择

    const storages = [];
    for (var i = item.min; i <= item.max; i++) {
      const paddedNumber = i.toString().padStart(4, "0");
      storages.push({
        label: item.value + "-" + paddedNumber,
        value: item.value + "-" + paddedNumber,
      });
    }
    setStorageOptions(storages);
  };

  // 处理库位选择
  const handleStorageChange = (item: StorageOption) => {
    setSelectedStorage(item.value);
  };

  // 确认选择
  const handleConfirm = () => {
    if (!selectedStorage) {
      Alert.alert("提示", "请选择具体库位");
      return;
    }

    onValueChange(selectedStorage);
    setModalVisible(false);

    // 重置选择状态
    setSelectedPrefix("");
    setSelectedStorage("");
    setStorageOptions([]);
  };

  // 取消选择
  const handleCancel = () => {
    setModalVisible(false);
    setSelectedPrefix("");
    setSelectedStorage("");
    setStorageOptions([]);
  };

  // 打开选择器
  const openPicker = () => {
    if (editable) {
      setModalVisible(true);
      fetchStorageData();
    }
  };

  useEffect(() => {
    fetchStorageData();
  }, []);

  return (
    <>
      <TouchableOpacity
        style={[
          styles.pickerButton,
          !editable && styles.disabledPickerButton,
          style,
        ]}
        onPress={openPicker}
        disabled={!editable}
      >
        <Text
          style={[
            styles.pickerText,
            !value && styles.placeholderText,
            !editable && styles.disabledPickerText,
            pickerTextStyle,
          ]}
        >
          {value || placeholder}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>选择库位</Text>

            {/* 库位前缀选择 */}
            <View style={styles.dropdownContainer}>
              <Text style={styles.dropdownLabel}>库位前缀:</Text>
              <Dropdown
                style={styles.dropdown}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                containerStyle={styles.dropdownContainer}
                itemTextStyle={styles.itemTextStyle}
                itemContainerStyle={styles.itemContainerStyle}
                data={prefixOptions}
                maxHeight={200}
                labelField="label"
                valueField="value"
                placeholder="选择前缀"
                value={selectedPrefix}
                onChange={handlePrefixChange}
                showsVerticalScrollIndicator={false}
              />
            </View>

            {/* 具体库位选择 */}
            <View style={styles.dropdownContainer}>
              <Text style={styles.dropdownLabel}>具体库位:</Text>
              <Dropdown
                style={[
                  styles.dropdown,
                  !selectedPrefix && styles.disabledDropdown,
                ]}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                containerStyle={styles.dropdownContainer}
                itemTextStyle={styles.itemTextStyle}
                itemContainerStyle={styles.itemContainerStyle}
                data={storageOptions}
                maxHeight={200}
                labelField="label"
                valueField="value"
                placeholder="选择库位"
                value={selectedStorage}
                onChange={handleStorageChange}
                showsVerticalScrollIndicator={false}
                disable={!selectedPrefix}
              />
            </View>

            {/* 按钮组 */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.confirmButton,
                  !selectedStorage && styles.disabledButton,
                ]}
                onPress={selectedStorage ? handleConfirm : undefined}
                disabled={!selectedStorage}
              >
                <Text
                  style={[
                    styles.confirmButtonText,
                    !selectedStorage && styles.disabledButtonText,
                  ]}
                >
                  确认
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  pickerText: {
    backgroundColor: "#f5f5f5",
    borderRadius: PX.n8,
    paddingHorizontal: PX.n8,
    paddingVertical: PX.n4,
    fontSize: PX.h18,
    fontFamily: "SongTi",
    color: "#333",
  },
  placeholderText: {
    color: "#999",
  },
  arrowIcon: {
    fontSize: 12,
    color: "#666",
    marginLeft: 8,
  },
  // 弹窗样式 - 参考新品入库工序产线弹窗
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: PX.n16,
    paddingHorizontal: PX.n24,
    paddingVertical: PX.n24,
    maxWidth: "80%",
    width: "auto",
    minWidth: PX.n50 * 5,
  },
  modalTitle: {
    fontSize: PX.h22,
    fontFamily: "SongTi",
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
    marginBottom: PX.n24,
  },
  // 字段容器样式
  dropdownContainer: {
    marginBottom: PX.n20,
  },
  dropdownLabel: {
    fontSize: PX.h18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: PX.n12,
    fontFamily: "SongTi",
  },
  dropdown: {
    backgroundColor: "#f5f5f5",
    borderRadius: PX.n8,
    paddingVertical: PX.n8,
    paddingHorizontal: PX.n8,
    borderWidth: 0,
    borderColor: "#ddd",
    width: "100%",
    minWidth: PX.n50 * 5,
    fontFamily: "SongTi",
    fontWeight: "bold",
  },
  disabledDropdown: {
    backgroundColor: "#f0f0f0",
    opacity: 0.6,
  },
  placeholderStyle: {
    fontSize: PX.h18,
    color: "#999",
    fontFamily: "SongTi",
  },
  selectedTextStyle: {
    fontSize: PX.h18,
    color: "#333",
    fontFamily: "SongTi",
    fontWeight: "bold",
  },
  itemTextStyle: {
    fontSize: PX.h18,
    color: "#333",
    fontFamily: "SongTi",
    fontWeight: "bold",
    marginVertical: -PX.n12,
  },
  itemContainerStyle: {
    paddingHorizontal: PX.n10,
    fontWeight: "bold",

    // paddingVertical: 0,
  },
  // 按钮容器样式
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: PX.n16,
    marginTop: PX.n16,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: PX.pv8,
    borderRadius: PX.n8,
    alignItems: "center",
    fontFamily: "SongTi",
    fontWeight: "bold",
  },
  cancelButton: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#ddd",
    fontFamily: "SongTi",
    fontWeight: "bold",
    borderRadius: 900,
  },
  confirmButton: {
    backgroundColor: "#007bff",
    fontFamily: "SongTi",
    fontWeight: "bold",
    borderRadius: 900,
  },
  disabledButton: {
    backgroundColor: "#ccc",
    opacity: 0.6,
  },
  cancelButtonText: {
    fontSize: PX.h18,
    color: "#666",
    fontFamily: "SongTi",
    fontWeight: "bold",
  },
  confirmButtonText: {
    fontSize: PX.h18,
    color: "#fff",
    fontWeight: "500",
    fontFamily: "SongTi",
  },
  disabledButtonText: {
    color: "#999",
  },
  // 禁用状态样式
  disabledPickerButton: {
    backgroundColor: "#f0f0f0",
    opacity: 0.6,
  },
  disabledPickerText: {
    color: "#999",
    backgroundColor: "#f0f0f0",
  },
});

export default StorageLocationPicker;
