package servlet;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import service.SaveDataService;

import java.io.IOException;
import java.io.PrintWriter;
public class GetDataServlet extends HttpServlet {
    public void service(HttpServletRequest request, HttpServletResponse response) throws ServletException,IOException {
    	String src = request.getParameter("srcFname") + "," + request.getParameter("srcPosition");
    	String dst = request.getParameter("dstFname") + "," + request.getParameter("dstPosition");
    	SaveDataService.saveData(src, dst);
    }
}