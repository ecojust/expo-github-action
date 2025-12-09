export default class Service {
  static groupData(list) {
    const group = new Map();

    console.log("groupData", list);
    let sum = 0;
    list.forEach((element) => {
      const key = element.process;
      if (!group.has(key)) {
        group.set(key, []);
      }
      sum += element.inventoryList.reduce(
        (sum, i) => sum + (Number(i.stockQuantity) || 0),
        0
      );
      group.get(key).push(...element.inventoryList);
    });

    const formatList = [];
    for (var [key, value] of group.entries()) {
      //   console.log(key, value);
      formatList.push({
        title: key,
        data: value,
      });
      //   const total = value.reduce(
      //     (sum, i) => sum + (Number(i.stockQuantity) || 0),
      //     0
      //   );
      //   group.set(key, { total, list: value });
    }

    return {
      sum,
      list: formatList,
    };
  }

  static calculateTotal(list) {
    list.forEach((element) => {
      console.log("element", element.processInventoryDetail);

      element.id = new Date().getTime() + Math.random();
      // total += element.inventoryList.reduce(
      //   (sum, i) => sum + (Number(i.stockQuantity) || 0),
      //   0
      // );
      let total = 0;
      element.processInventoryDetail.forEach((process) => {
        process.uuid = new Date().getTime() + Math.random();
        total += Number(process.stockQuantity) || 0;

        // process.processInventoryDetail.forEach((detail) => {
        //   detail.id = new Date().getTime() + Math.random();
        // });
      });
      element.total = total;
    });

    return list;
  }
}
