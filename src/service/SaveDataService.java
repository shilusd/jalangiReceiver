package service;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map.Entry;

public class SaveDataService {
	private static HashSet<String> set = new HashSet<String>();
	private static ArrayList<String> list = new ArrayList<String>();
	public static boolean saveData(String src, String dst) {
		//if (map.get(src)!=null&&map.get(src).equals(dst)) {
		//	return false;
		//} else {
			//map.put(src, dst);
		src = src.replaceAll("_orig_", "");
		dst = dst.replaceAll("_orig_", "");
		src = src.split(",")[1];
		dst = dst.split(",")[1];
		if (src.length()>1) {
			System.out.println(src);
			src = src.substring(1,src.indexOf(':'));
		} else {
			src = "0";
		}
		
		if (dst.length()>1) {
			dst = dst.substring(1,dst.indexOf(':'));
		} else {
			dst = "0";
		}
		src = src.replace('.', '_');
		dst = dst.replace('.', '_');
		src = src.replace('\\','.');
		dst = dst.replace('\\','.');

		if (set.contains(src+dst)||set.contains(dst+src)) {
			return false;
		} else {
			set.add(src+dst);
			list.add(src+","+dst+"\n");
			return true;
		}
		
		//}
	}
	
	public static void saveFile(String proj, String fileName) throws IOException {
		File f = new File("e:/tmp/"+fileName+".txt");
		if (!f.exists()) {
			f.createNewFile();
		}
		FileWriter fw = new FileWriter(f);
		BufferedWriter bw= new BufferedWriter(fw);
		
		while (!list.isEmpty()) {
			String[] s = list.remove(0).split(",");
			if (s[0].length()<2) {
				continue;
			}
			s[0] = s[0].substring(s[0].indexOf(proj));
			s[1] = s[1].substring(s[1].indexOf(proj));

			bw.write(s[0]+","+s[1]);
		}
		
		set = new HashSet<String>();
		bw.close();
		fw.close();
	}
}
