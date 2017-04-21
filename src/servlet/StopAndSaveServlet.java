package servlet;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import service.SaveDataService;

import java.io.IOException;
import java.io.PrintWriter;
public class StopAndSaveServlet extends HttpServlet {
    public void service(HttpServletRequest request, HttpServletResponse response) throws ServletException,IOException {
    	SaveDataService.saveFile(request.getParameter("proj"),request.getParameter("fileName"));
    }
}