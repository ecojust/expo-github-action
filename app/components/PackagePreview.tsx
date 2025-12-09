import React from "react";
import { View, Text, StyleSheet } from "react-native";
import QRCode from "react-native-qrcode-svg";
import * as PX from "@/app/pages/config";

interface PackagePreviewProps {
  qrCodeString: string;
  packageId?: string;
  infoFields: {
    label: string;
    value: string;
  }[];
  width?: number;
  height?: number;
}

export default function PackagePreview({
  qrCodeString,
  packageId,
  infoFields,
  width = 70 * 5 * PX.scale,
  height = 40 * 5 * PX.scale,
}: PackagePreviewProps) {
  const qrSectionWidth = width * 0.4;
  const infoSectionWidth = width * 0.6;
  const qrSize = Math.min(qrSectionWidth * 0.9, height * 0.8);

  return (
    <View style={styles.packagePreviewContent}>
      <View style={[styles.packagePreviewRow, { width, height }]}>
        <View
          style={[styles.packagePreviewQRSection, { width: qrSectionWidth }]}
        >
          <QRCode
            value={qrCodeString}
            size={qrSize}
            backgroundColor="white"
            color="black"
            quietZone={6}
          />
          {packageId && (
            <Text style={styles.packagePreviewIdText}>ID : {packageId}</Text>
          )}
        </View>
        <View
          style={[
            styles.packagePreviewInfoSection,
            { width: infoSectionWidth },
          ]}
        >
          {infoFields.map((field, index) => (
            <Text key={index} style={styles.packagePreviewInfoText}>
              {field.label}: {field.value}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  packagePreviewContent: {
    alignItems: "center",
  },
  packagePreviewRow: {
    flexDirection: "row",
    // borderColor: "#333",
    backgroundColor: "white",
    // borderRadius: PX.n8,
    alignItems: "center",
    // borderWidth: 2,
  },
  packagePreviewQRSection: {
    alignItems: "center",
    justifyContent: "center",
    paddingRight: PX.n2,
    // borderWidth: 2,
    borderColor: "#333",
    height: "100%",
  },
  packagePreviewInfoSection: {
    // borderWidth: 2,
    borderColor: "#333",
    paddingLeft: PX.n8,
    justifyContent: "center",
    height: "100%",
  },
  packagePreviewIdText: {
    fontSize: PX.h18,
    fontFamily: "SongTi",
    color: "#000",
    marginTop: PX.n8,
    textAlign: "center",
    fontWeight: "bold",
  },
  packagePreviewInfoText: {
    fontSize: PX.h16,
    fontFamily: "SongTi",
    color: "#000",
    marginBottom: PX.n6,
    lineHeight: PX.h20,
    fontWeight: "500",
  },
});
